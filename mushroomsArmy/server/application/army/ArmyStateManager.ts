import { Army, TArmyState, TBuildingInput } from './Army';
import Common from '../modules/common/Common';
import FormationPlanner from './FormationPlanner';

export type ArmyMode = 'defense' | 'attack' | 'balanced';

export type TFormationState = {
    center: { x: number; y: number };
    slots: {
        champigneb: { x: number; y: number }[];
        sporomet: { x: number; y: number }[];
        eblekar: { x: number; y: number }[];
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
    requestType: 'request_buildings';
    data?: {
        buildingType: string;
    };
}

export interface EconomyResponse {
    success: boolean;
}

export interface BuildQueueItem {
    type: 'sporovaya_bashnya' | 'vzryvomor';
    x: number;
    y: number;
    scheduledAt: number;
    isRebuild?: boolean; // флаг, что это восстановление уничтоженного здания
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
    private readonly REBUILD_DELAY = 10000; // 10 сек для восстановления уничтоженного здания
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

    private knownUnitGuids: Set<string> = new Set();

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
        this.assignNewUnitsToFormation();
        this.updateScouts();
        this.updateDistanceTraveled();
        this.processAutoBuild();
    }

    private assignNewUnitsToFormation(): void {
        for (const guid of this.knownUnitGuids) {
            const unit = this.army.units.find(u => u.guid === guid);
            if (!unit || !unit.isAlive) this.knownUnitGuids.delete(guid);
        }
        for (const u of this.army.units) {
            if (u.isAlive) this.knownUnitGuids.add(u.guid);
        }

        if (this.metrics.currentMode === 'attack') return;

        const planner = this.ensureFormationPlanner();
        if (!planner) return;

        for (const u of this.army.units) {
            if (!u.isAlive) continue;
            if (u.type !== 'sporomet' && u.type !== 'eblekar' && u.type !== 'champigneb') continue;
            if (u.formationTarget) continue;
        }
    }

    // Тик-логика формации: counts → планнер → stable assign → wall trigger.
    // Семантика — spec/formation.md.
    private updateFormationAndWalls(): void {
        const planner = this.ensureFormationPlanner();
        if (!planner) return;

        const aliveUnits = this.army.units.filter(u => u.isAlive);
        const counts = { sporomet: 0, eblekar: 0, champigneb: 0 };
        for (const u of this.army.units) {
            if (!u.isAlive) continue;
            if (u.type === 'sporomet') counts.sporomet++;
            else if (u.type === 'eblekar') counts.eblekar++;
            else if (u.type === 'champigneb') counts.champigneb++;
        }

        // Режим Атаки
        if (this.metrics.currentMode === 'attack') {
            const allCombat = aliveUnits.filter(
                u => u.type === 'sporomet' || u.type === 'eblekar' || u.type === 'champigneb'
            );

            if (allCombat.length === 0) return;

            // Синхронизируем скорость
            this.syncGroupSpeed(allCombat);

            const avgX = allCombat.reduce((s, u) => s + u.x, 0) / allCombat.length;
            const avgY = allCombat.reduce((s, u) => s + u.y, 0) / allCombat.length;

            // Ближайший враг
            const nearestEnemy = this.findNearestEnemy(avgX, avgY);

            // Направление марша: к врагу если есть, иначе к (0,0)
            const marchDirX = nearestEnemy ? nearestEnemy.x - avgX : 0 - avgX;
            const marchDirY = nearestEnemy ? nearestEnemy.y - avgY : 0 - avgY;
            const marchNorm = Math.sqrt(marchDirX * marchDirX + marchDirY * marchDirY) || 1;
            const enemyNear = nearestEnemy
                ? Math.sqrt((nearestEnemy.x - avgX) ** 2 + (nearestEnemy.y - avgY) ** 2) <= 25
                : false;

            // Строим полукруг вокруг центра масс группы
            const slots = this.buildMarchSemicircle(
                allCombat,
                avgX, avgY,
                marchDirX / marchNorm, marchDirY / marchNorm,
                counts,
            );

            this.assignFormationTargets(slots);

            const formationReady = allCombat.every(u => {
                if (!u.formationTarget) return false;
                const dx = u.x - u.formationTarget.x;
                const dy = u.y - u.formationTarget.y;
                return Math.sqrt(dx * dx + dy * dy) <= 1.5;
            });

            for (const u of aliveUnits) {
                if (u.type === 'pizdoglyad') {
                    u.formationHold = false;
                    continue;
                }

                u.formationHold = !formationReady && !enemyNear;
            }
            for (const u of allCombat) {
                u.leashRadius = enemyNear ? 18 : formationReady ? 12 : Infinity;
            }

            if (!nearestEnemy) {
                for (const u of allCombat) {
                    if (u.formationTarget) {
                        const slotOffsetX = u.formationTarget.x - avgX;
                        const slotOffsetY = u.formationTarget.y - avgY;
                        u.formationTarget = {
                            x: Math.max(0, Math.round(slotOffsetX)),
                            y: Math.max(0, Math.round(slotOffsetY)),
                        };
                    } else {
                        u.formationTarget = { x: 0, y: 0 };
                    }
                    (u as any).hasReachedFormation = false;
                    (u as any).reachedTarget = false;
                    (u as any).isAtFormationTarget = false;
                }
                return;
            }
            return;
        }

        // Оборонительный режим - армия стоит у базы и атакует всех врагов в пределах видимости
        for (const u of aliveUnits) {
            u.currentSpeed = u.speed;
            u.formationHold = false;
            u.leashRadius = 20;
        }

        // В оборонительном режиме используем defenceHold
        const slots = planner.updateForCounts(counts, { defenseHold: true });
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
        // Динамическая генерация новых линий обороны по продвижению армии отключена.
    }

    private buildMarchSemicircle(
        units: { type: string }[],
        cx: number, cy: number,
        dirX: number, dirY: number,
        counts: { sporomet: number; eblekar: number; champigneb: number },
    ): Record<'sporomet' | 'eblekar' | 'champigneb', { x: number; y: number }[]> {
        const map = this.army.map;
        const rows = map?.length ?? 0;
        const cols = map?.[0]?.length ?? 0;

        const isWalkable = (x: number, y: number): boolean => {
            if (x < 0 || y < 0 || x >= cols || y >= rows) return false;
            const tile = map[y]?.[x];
            return tile === 0 || tile === 2;
        };

        const angle = Math.atan2(dirY, dirX);
        const arcSlots = (
            r: number, n: number, spreadRad: number, offsetAngle = 0,
        ): { x: number; y: number }[] => {
            if (n === 0) return [];
            const slots: { x: number; y: number }[] = [];
            for (let i = 0; i < n; i++) {
                const t = n > 1 ? (i / (n - 1) - 0.5) * spreadRad : 0;
                const a = angle + offsetAngle + t;
                const sx = Math.round(cx + r * Math.cos(a));
                const sy = Math.round(cy + r * Math.sin(a));
                let placed = false;
                for (let dr = 0; dr <= 2 && !placed; dr++) {
                    for (const [ox, oy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]) {
                        const nx = sx + ox * dr, ny = sy + oy * dr;
                        if (isWalkable(nx, ny)) {
                            slots.push({ x: nx, y: ny });
                            placed = true;
                            break;
                        }
                    }
                }
                if (!placed) slots.push({ x: Math.max(0, sx), y: Math.max(0, sy) });
            }
            return slots;
        };

        const champSlots = arcSlots(8, counts.champigneb, Math.PI * 0.8);
        const sporSlots = arcSlots(4, counts.sporomet, Math.PI * 0.7);
        const eblSlots = arcSlots(4, counts.eblekar, Math.PI * 0.7, Math.PI);

        return { champigneb: champSlots, sporomet: sporSlots, eblekar: eblSlots };
    }

    private findNearestEnemy(fromX: number, fromY: number): { x: number; y: number } | null {
        const targets: { x: number; y: number }[] = [
            ...this.army.enemyUnits.filter(u => u.isAlive),
            ...this.army.enemyBuildings.filter(b => (b.hp ?? 1) > 0),
        ];

        if (targets.length === 0) return null;

        let nearest: { x: number; y: number } | null = null;
        let nearestDist = Infinity;

        for (const t of targets) {
            const dx = t.x - fromX;
            const dy = t.y - fromY;
            const dist = dx * dx + dy * dy;
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = { x: t.x, y: t.y };
            }
        }

        return nearest;
    }

    private syncGroupSpeed(units: { type: string; isAlive: boolean; speed: number; currentSpeed: number }[]): void {
        const combat = units.filter(
            u => u.isAlive &&
                (u.type === 'sporomet' || u.type === 'eblekar' || u.type === 'champigneb')
        );
        if (combat.length === 0) return;

        const minSpeed = combat.reduce((m, u) => Math.min(m, u.speed), Infinity);
        for (const u of combat) {
             u.currentSpeed = minSpeed;
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

    //Обновляет режим: атака при >100 юнитов, оборона при <20
    private updateMode(): void {
        const count = this.metrics.aliveUnitsCount;
        let newMode: ArmyMode = 'balanced';

        if (count > 100) {
            newMode = 'attack';
        } else if (count < 20) {
            newMode = 'defense';
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

        // Обработка очереди восстановления уничтоженных зданий
        await this.processRebuildQueue(now);

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

    private async processRebuildQueue(now: number): Promise<void> {
        const readyToRebuild = this.buildQueue.filter(item => 
            item.isRebuild && (now - item.scheduledAt >= this.REBUILD_DELAY)
        );

        for (const item of readyToRebuild) {
            await this.tryBuildStructure(item.type, item.x, item.y);
        }

        // Удаляем обработанные элементы из очереди
        this.buildQueue = this.buildQueue.filter(item => 
            !item.isRebuild || (now - item.scheduledAt < this.REBUILD_DELAY)
        );
    }

    public scheduleRebuild(type: 'sporovaya_bashnya' | 'vzryvomor', x: number, y: number): void {
        this.buildQueue.push({
            type,
            x,
            y,
            scheduledAt: Date.now(),
            isRebuild: true
        });
    }

    private async tryBuildStructure(
        type: 'sporovaya_bashnya' | 'vzryvomor',
        fixedX?: number,
        fixedY?: number
    ): Promise<void> {
        if (!this.economyRequestCallback) return;

        const response = await this.economyRequestCallback({
            armyGuid: this.army.guid,
            requestType: 'request_buildings',
            data: { buildingType: type },
        });

        if (!response?.success) return;

        // Ищем место для постройки (если не задано фиксированное место)
        const position = fixedX !== undefined && fixedY !== undefined
            ? { x: fixedX, y: fixedY }
            : this.findBuildPosition(type);
        if (!position) return;

        // Строим
        this.army.spawnBuilding(type, position.x, position.y, this.common);
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
                sporomet: p.getSlots('sporomet').map(s => ({ x: s.x, y: s.y })),
                eblekar: p.getSlots('eblekar').map(s => ({ x: s.x, y: s.y })),
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
        const baseWallTopY = rows - 15;
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
