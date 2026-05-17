import { Army, TArmyState, TBuildingInput } from './Army';
import Common from '../modules/common/Common';
import FormationPlanner from './FormationPlanner';

export type ArmyMode = 'defense' | 'attack' | 'balanced';

export type TFormationState = {
    center: { x: number; y: number };
    slots: {
        champigneb: { x: number; y: number }[];
        sporomet:   { x: number; y: number }[];
        eblekar:    { x: number; y: number }[];
    };
};

export interface ArmyMetrics {
    aliveUnitsCount: number;
    totalUnitsSpawned: number;
    scoutsAlive: number;
    buildingsAlive: number;
    currentMode: ArmyMode;
    distanceTraveled: number;
    lastDistanceMilestone: number;
}

export interface ScoutTracker {
    guid: string;
    spawnTime: number;
    lastPosition: { x: number; y: number };
}

export interface ArmyStateManagerOptions {
    army: Army;
    common: Common;
    onModeChange?: (newMode: ArmyMode) => void;
    onDistanceMilestone?: (distance: number) => void;
    onScoutRespawn?: (scoutGuid: string) => void;
    economyRequestCallback?: (request: EconomyRequest) => Promise<EconomyResponse | null>;
}

export interface EconomyRequest {
    armyGuid: string;
    requestType: 'resources' | 'can_build' | 'production_status';
    data?: Record<string, unknown>;
}

export interface EconomyResponse {
    success: boolean;
    data?: {
        resources?: { gold?: number; food?: number; wood?: number };
        canBuild?: boolean;
        production?: { queue: string[]; eta: number };
    };
}

export interface BuildQueueItem {
    type: 'sporovaya_bashnya' | 'vzryvomor';
    x: number;
    y: number;
    scheduledAt: number;
}

export class ArmyStateManager {
    private army: Army;
    private common: Common;
    
    // Метрики
    private metrics: ArmyMetrics = {
        aliveUnitsCount: 0,
        totalUnitsSpawned: 0,
        scoutsAlive: 0,
        buildingsAlive: 0,
        currentMode: 'balanced',
        distanceTraveled: 0,
        lastDistanceMilestone: 0,
    };

    // Разведчики
    private scouts: Map<string, ScoutTracker> = new Map();
    private readonly MAX_SCOUTS = 3;
    private readonly SCOUT_RESPAWN_DELAY = 5000; // 5 секунд
    private scoutRespawnTimers: Map<string, NodeJS.Timeout> = new Map();

    // Дистанция
    private readonly DISTANCE_MILESTONE = 15; // метров
    private unitPositionHistory: Map<string, { x: number; y: number }> = new Map();

    // Авто-постройка
    private buildQueue: BuildQueueItem[] = [];
    private readonly TOWER_BUILD_INTERVAL = 180000; // 180 сек
    private readonly WALL_BUILD_INTERVAL = 30000; // 30 сек
    private lastTowerBuild = 0;
    private lastWallBuild = 0;

    // Коллбэки
    private onModeChange?: (newMode: ArmyMode) => void;
    private onDistanceMilestone?: (distance: number) => void;
    private onScoutRespawn?: (scoutGuid: string) => void;
    private economyRequestCallback?: (request: EconomyRequest) => Promise<EconomyResponse | null>;

    // Планировщик построения (lazy-init: базы и карта известны после конструктора Army)
    private formationPlanner: FormationPlanner | null = null;

    // Интервал обновления
    private updateInterval?: NodeJS.Timeout;
    private readonly UPDATE_RATE = 200; // мс

    constructor(options: ArmyStateManagerOptions) {
        this.army = options.army;
        this.common = options.common;
        this.onModeChange = options.onModeChange;
        this.onDistanceMilestone = options.onDistanceMilestone;
        this.onScoutRespawn = options.onScoutRespawn;
        this.economyRequestCallback = options.economyRequestCallback;

        this.startTracking();
    }

    private startTracking(): void {
        this.updateInterval = setInterval(() => {
            this.update();
        }, this.UPDATE_RATE);
    }

    private update(): void {
        this.updateUnitMetrics();
        this.updateBuildingMetrics();
        this.updateMode();
        this.updateFormationAndWalls();
        this.updateScouts();
        this.updateDistanceTraveled();
        this.processAutoBuild();
    }

    // Тик-логика формации: counts → планнер → stable assign → wall trigger.
    // Семантика — spec/formation.md.
    private updateFormationAndWalls(): void {
        const planner = this.ensureFormationPlanner();
        if (!planner) return;

        const counts = { sporomet: 0, eblekar: 0, champigneb: 0 };
        for (const u of this.army.units) {
            if (!u.isAlive) continue;
            if (u.type === 'sporomet')       counts.sporomet++;
            else if (u.type === 'eblekar')   counts.eblekar++;
            else if (u.type === 'champigneb') counts.champigneb++;
        }

        const slots = planner.updateForCounts(counts);
        this.assignFormationTargets(slots);

        // Settle-detection (spec §5): юниты в transit и без слота не считаются —
        // иначе стены строятся на спавне далеко от формации.
        const SETTLE_RADIUS = 1;
        const unitPositions: { x: number; y: number }[] = [];
        for (const u of this.army.units) {
            if (!u.isAlive) continue;
            if (u.type !== 'sporomet' && u.type !== 'eblekar' && u.type !== 'champigneb') continue;
            if (!u.formationTarget) continue;
            const dx = Math.abs(u.x - u.formationTarget.x);
            const dy = Math.abs(u.y - u.formationTarget.y);
            if (Math.max(dx, dy) > SETTLE_RADIUS) continue;
            unitPositions.push({ x: u.x, y: u.y });
        }
        const newWallPositions = planner.checkWallTrigger(unitPositions);
        if (newWallPositions) {
            for (const pos of newWallPositions) {
                this.army.spawnBuilding('vzryvomor', pos.x, pos.y, this.common);
            }
        }
    }

    // Stable assignment (spec §4.1): юниты с target в новом slots[type] сохраняют его;
    // остальные получают свободные слоты в wave-order; излишки → null.
    private assignFormationTargets(slots: Record<'sporomet' | 'eblekar' | 'champigneb', { x: number; y: number }[]>): void {
        for (const type of ['sporomet', 'eblekar', 'champigneb'] as const) {
            const alive = this.army.units.filter(u => u.isAlive && u.type === type);
            const typeSlots = slots[type];

            const slotKey = (s: { x: number; y: number }) => `${s.x},${s.y}`;
            const slotMap = new Map<string, { x: number; y: number }>();
            for (const s of typeSlots) slotMap.set(slotKey(s), s);

            const claimedKeys = new Set<string>();
            for (const u of alive) {
                if (!u.formationTarget) continue;
                const k = slotKey(u.formationTarget);
                if (slotMap.has(k) && !claimedKeys.has(k)) {
                    claimedKeys.add(k);
                } else {
                    u.formationTarget = null;
                }
            }

            const freeSlots = typeSlots.filter(s => !claimedKeys.has(slotKey(s)));
            let freeIdx = 0;
            for (const u of alive) {
                if (u.formationTarget) continue;
                if (freeIdx < freeSlots.length) {
                    u.formationTarget = { x: freeSlots[freeIdx].x, y: freeSlots[freeIdx].y };
                    freeIdx++;
                } else {
                    u.formationTarget = null;
                }
            }
        }
    }

    private updateUnitMetrics(): void {
        const aliveUnits = this.army.units.filter(u => u.isAlive);
        this.metrics.aliveUnitsCount = aliveUnits.length;

        // Подсчет разведчиков
        this.metrics.scoutsAlive = aliveUnits.filter(u => u.type === 'pizdoglyad').length;
    }

    private updateBuildingMetrics(): void {
        this.metrics.buildingsAlive = this.army.buildings.filter(b => b.isAlive).length;
    }

    //Обновляет режим
    private updateMode(): void {
        const count = this.metrics.aliveUnitsCount;
        let newMode: ArmyMode = 'balanced';

        if (count < 50) {
            newMode = 'defense';
        } else if (count > 100) {
            newMode = 'attack';
        }

        if (newMode !== this.metrics.currentMode) {
            this.metrics.currentMode = newMode;
            this.onModeChange?.(newMode);
        }
    }

    private updateScouts(): void {
        const aliveScouts = this.army.units.filter(u => u.type === 'pizdoglyad' && u.isAlive);
        
        // Обновляем список активных разведчиков
        const currentScoutGuids = new Set(aliveScouts.map(s => s.guid));
        
        // Удаляем мертвых разведчиков 
        for (const [guid, scout] of this.scouts.entries()) {
            if (!currentScoutGuids.has(guid)) {
                this.scouts.delete(guid);
                this.scheduleScoutRespawn(guid);
            }
        }

        // Добавляем новых разведчиков 
        for (const scout of aliveScouts) {
            if (!this.scouts.has(scout.guid)) {
                this.scouts.set(scout.guid, {
                    guid: scout.guid,
                    spawnTime: Date.now(),
                    lastPosition: { x: scout.x, y: scout.y },
                });
            } else {
                const tracker = this.scouts.get(scout.guid)!;
                tracker.lastPosition = { x: scout.x, y: scout.y };
            }
        }

        //респаун недостающих разведчиков
        const scoutsNeeded = this.MAX_SCOUTS - aliveScouts.length;
        if (scoutsNeeded > 0 && this.scoutRespawnTimers.size === 0) {
            for (let i = 0; i < scoutsNeeded; i++) {
                this.spawnScout();
            }
        }
    }

    private scheduleScoutRespawn(oldGuid: string): void {
        if (this.scoutRespawnTimers.has(oldGuid)) {
            return;
        }

        const timer = setTimeout(() => {
            this.spawnScout();
            this.scoutRespawnTimers.delete(oldGuid);
        }, this.SCOUT_RESPAWN_DELAY);

        this.scoutRespawnTimers.set(oldGuid, timer);
    }

    /**
     * Спавнит нового разведчика в безопасной зоне
     */
    private spawnScout(): void {
        const map = this.army.map;
        if (!map || map.length === 0) return;

        const rows = map.length;
        const cols = map[0].length;

        // Ищем тайл в правом нижнем углу (зона спауна)
        for (let dy = 0; dy < 15; dy++) {
            for (let dx = 0; dx < 15; dx++) {
                const y = rows - 1 - dy;
                const x = cols - 1 - dx;
                if (y >= 0 && x >= 0 && map[y][x] === 0) {
                    const result = this.army.spawnUnit('pizdoglyad', x, y, this.common);
                    if (result) {
                        this.metrics.totalUnitsSpawned++;
                        this.onScoutRespawn?.(result.guid);
                        return;
                    }
                }
            }
        }
    }


    //Обновляет пройденную дистанцию и генерирует события milestone
    private updateDistanceTraveled(): void {
        let totalDistance = 0;

        for (const unit of this.army.units) {
            if (!unit.isAlive) continue;

            const lastPos = this.unitPositionHistory.get(unit.guid);
            if (lastPos) {
                const dx = unit.x - lastPos.x;
                const dy = unit.y - lastPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                totalDistance += distance;
            }

            this.unitPositionHistory.set(unit.guid, { x: unit.x, y: unit.y });
        }

        this.metrics.distanceTraveled += totalDistance;

        const currentMilestone = Math.floor(this.metrics.distanceTraveled / this.DISTANCE_MILESTONE);
        const lastMilestone = Math.floor(this.metrics.lastDistanceMilestone / this.DISTANCE_MILESTONE);

        if (currentMilestone > lastMilestone) {
            this.metrics.lastDistanceMilestone = this.metrics.distanceTraveled;
            this.onDistanceMilestone?.(this.metrics.distanceTraveled);
        }
    }

    private async processAutoBuild(): Promise<void> {
        const now = Date.now();

        // Постройка башни каждые 180 сек
        if (now - this.lastTowerBuild >= this.TOWER_BUILD_INTERVAL) {
            await this.tryBuildStructure('sporovaya_bashnya');
            this.lastTowerBuild = now;
        }

        // Постройка стены каждые 30 сек
        if (now - this.lastWallBuild >= this.WALL_BUILD_INTERVAL) {
            await this.tryBuildStructure('vzryvomor');
            this.lastWallBuild = now;
        }
    }

    private async tryBuildStructure(type: 'sporovaya_bashnya' | 'vzryvomor'): Promise<void> {
        if (this.economyRequestCallback) {
            const response = await this.economyRequestCallback({
                armyGuid: this.army.guid,
                requestType: 'can_build',
                data: { buildingType: type },
            });

            if (!response?.success || !response.data?.canBuild) {
                return; // Недостаточно ресурсов
            }
        }

        // Ищем место для постройки
        const position = this.findBuildPosition(type);
        if (!position) return;

        // Строим
        const result = this.army.spawnBuilding(type, position.x, position.y, this.common);
        if (result) {
            if (this.economyRequestCallback) {
                await this.economyRequestCallback({
                    armyGuid: this.army.guid,
                    requestType: 'resources',
                    data: { action: 'spend', buildingType: type },
                });
            }
        }
    }

    private findBuildPosition(type: 'sporovaya_bashnya' | 'vzryvomor'): { x: number; y: number } | null {
        const map = this.army.map;
        if (!map || map.length === 0) return null;

        const rows = map.length;
        const cols = map[0].length;

        // Зона постройки: правый нижний угол 15×15
        const zoneX0 = Math.max(0, cols - 15);
        const zoneY0 = Math.max(0, rows - 15);

        if (type === 'vzryvomor') {
            // Ищем свободный тайл 1×1
            for (let y = zoneY0; y < rows; y++) {
                for (let x = zoneX0; x < cols; x++) {
                    if (map[y][x] === 0) {
                        return { x, y };
                    }
                }
            }
        } else {
            // Ищем свободный блок 2×2
            for (let y = zoneY0; y < rows - 1; y++) {
                for (let x = zoneX0; x < cols - 1; x++) {
                    if (
                        map[y][x] === 0 &&
                        map[y + 1][x] === 0 &&
                        map[y][x + 1] === 0 &&
                        map[y + 1][x + 1] === 0
                    ) {
                        return { x, y };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Возвращает текущее состояние формации для отрисовки в UI: центр и
     * все слоты по эшелонам (после фильтра карты). Клиент использует это
     * чтобы нарисовать рамку и пустые маркеры слотов поверх юнитов.
     */
    public getFormationState(): TFormationState | null {
        const p = this.formationPlanner;
        if (!p) return null;
        const c = p.center;
        return {
            center: { x: c.x, y: c.y },
            slots: {
                champigneb: p.getSlots('champigneb').map(s => ({ x: s.x, y: s.y })),
                sporomet:   p.getSlots('sporomet').map(s   => ({ x: s.x, y: s.y })),
                eblekar:    p.getSlots('eblekar').map(s    => ({ x: s.x, y: s.y })),
            },
        };
    }

    private ensureFormationPlanner(): FormationPlanner | null {
        if (this.formationPlanner) return this.formationPlanner;

        const map = this.army.map;
        if (!map || map.length === 0 || (map[0]?.length ?? 0) === 0) return null;

        // Base zone — правый нижний угол 15×15 (Army.generateDefensiveLayout).
        // Вычисляем из текущей карты, не хардкодим — на случай других размеров.
        const rows = map.length;
        const cols = map[0].length;
        const baseWallTopY  = rows - 15;
        const baseWallLeftX = cols - 15;

        // Центр базы = среднее по координатам своих башен (если есть), иначе
        // геометрический центр угловой зоны.
        const towers = this.army.buildings.filter(b => b.type === 'sporovaya_bashnya');
        let baseCenter: { x: number; y: number };
        if (towers.length > 0) {
            let sumX = 0, sumY = 0;
            for (const t of towers) { sumX += t.x; sumY += t.y; }
            baseCenter = { x: sumX / towers.length, y: sumY / towers.length };
        } else {
            baseCenter = {
                x: baseWallLeftX + 7,
                y: baseWallTopY + 7,
            };
        }

        this.formationPlanner = new FormationPlanner({
            map,
            baseCenter,
            baseWallTopY,
            baseWallLeftX,
        });
        return this.formationPlanner;
    }

    public registerUnitSpawn(type: string, guid: string): void {
        this.metrics.totalUnitsSpawned++;

        if (type === 'pizdoglyad') {
            this.scouts.set(guid, {
                guid,
                spawnTime: Date.now(),
                lastPosition: { x: 0, y: 0 },
            });
        }
    }

    public getMetrics(): Readonly<ArmyMetrics> {
        return { ...this.metrics };
    }

    public getScouts(): ScoutTracker[] {
        return Array.from(this.scouts.values());
    }

    public async requestEconomy(request: Omit<EconomyRequest, 'armyGuid'>): Promise<EconomyResponse | null> {
        if (!this.economyRequestCallback) return null;

        return this.economyRequestCallback({
            armyGuid: this.army.guid,
            ...request,
        });
    }

    public destroy(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        for (const timer of this.scoutRespawnTimers.values()) {
            clearTimeout(timer);
        }

        this.scoutRespawnTimers.clear();
        this.scouts.clear();
        this.unitPositionHistory.clear();
    }
}
