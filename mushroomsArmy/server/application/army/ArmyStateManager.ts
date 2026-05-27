import { Army, TArmyState, TBuildingInput } from './Army';
import Common from '../modules/common/Common';

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

    // Коллбэки
    private onModeChange?: (newMode: ArmyMode) => void;
    private onDistanceMilestone?: (distance: number) => void;
    private onScoutRespawn?: (scoutGuid: string) => void;
    private economyRequestCallback?: (request: EconomyRequest) => Promise<EconomyResponse | null>;

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
    }

    private assignNewUnitsToFormation(): void {
        for (const guid of this.knownUnitGuids) {
            const unit = this.army.units.find(u => u.guid === guid);
            if (!unit || !unit.isAlive) this.knownUnitGuids.delete(guid);
        }
        for (const u of this.army.units) {
            if (u.isAlive) this.knownUnitGuids.add(u.guid);
        }
    }

    // Тик-логика формации: равномерная шахматная расстановка по слоям.
    private updateFormationAndWalls(): void {
        const aliveUnits = this.army.units.filter(u => u.isAlive);
        const map = this.army.map;
        if (!map || map.length === 0 || (map[0]?.length ?? 0) === 0) return;

        const rows = map.length;
        const cols = map[0].length;
        const baseWallTopY = Math.max(0, rows - 15);
        const baseWallLeftX = Math.max(0, cols - 15);

        const isDefenseWalkable = (x: number, y: number): boolean => {
            return x >= 0 && y >= 0 && x < cols && y < rows && (map[y][x] === 0 || map[y][x] === 2);
        };

        const collectCheckerboardSlots = (
            rowOffsets: number[],
            colOffsets: number[],
            count: number,
            parity: number,
        ): { x: number; y: number }[] => {
            if (count <= 0) return [];
            const candidates: { x: number; y: number }[] = [];
            const candidateKeys = new Set<string>();

            for (const offset of rowOffsets) {
                const y = baseWallTopY + offset;
                if (y < 0 || y >= rows) continue;
                for (let x = baseWallLeftX; x < cols; x++) {
                    if (!isDefenseWalkable(x, y)) continue;
                    if (((x + y + parity) & 1) !== 0) continue;
                    const key = `${x},${y}`;
                    if (candidateKeys.has(key)) continue;
                    candidateKeys.add(key);
                    candidates.push({ x, y });
                }
            }

            for (const offset of colOffsets) {
                const x = baseWallLeftX + offset;
                if (x < 0 || x >= cols) continue;
                for (let y = baseWallTopY; y < rows; y++) {
                    if (!isDefenseWalkable(x, y)) continue;
                    if (((x + y + parity) & 1) !== 0) continue;
                    const key = `${x},${y}`;
                    if (candidateKeys.has(key)) continue;
                    candidateKeys.add(key);
                    candidates.push({ x, y });
                }
            }

            if (candidates.length === 0) return [];
            const slotCount = Math.min(count, candidates.length);
            if (slotCount === candidates.length) return candidates;
            const selected: { x: number; y: number }[] = [];
            const step = (candidates.length - 1) / Math.max(1, slotCount - 1);
            for (let i = 0; i < slotCount; i++) {
                selected.push(candidates[Math.round(i * step)]);
            }
            return selected;
        };

        const typeCounts = {
            sporomet: aliveUnits.filter(u => u.type === 'sporomet').length,
            eblekar: aliveUnits.filter(u => u.type === 'eblekar').length,
            champigneb: aliveUnits.filter(u => u.type === 'champigneb').length,
        };

        const maxEblekarSlots = Math.max(0, Math.floor(typeCounts.sporomet / 4));
        const eblekarSlotsToUse = Math.min(typeCounts.eblekar, maxEblekarSlots);

        const champSlots = collectCheckerboardSlots([-3, -2], [-3, -2], typeCounts.champigneb, 0);
        const sporSlots = collectCheckerboardSlots([1, 2], [1, 2], typeCounts.sporomet, 1);
        const ebleSlots = collectCheckerboardSlots([3, 4], [0, 1], eblekarSlotsToUse, 0);

        this.assignFormationTargets({
            champigneb: champSlots,
            sporomet: sporSlots,
            eblekar: ebleSlots,
        });

        for (const u of aliveUnits) {
            if (u.type === 'pizdoglyad') {
                u.formationHold = false;
                u.leashRadius = Infinity;
                u.formationTarget = null;
                continue;
            }

            if (u.type === 'sporomet' || u.type === 'eblekar') {
                u.formationHold = true;
                u.leashRadius = 2;
                continue;
            }

            if (u.type === 'champigneb') {
                u.formationHold = true;
                u.leashRadius = 4;
                continue;
            }
        }
    }


    private findNearestEnemy(fromX: number, fromY: number,): { x: number; y: number } | null {
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
        // Глобальная таблица занятых слотов (по координатам) — чтобы избежать
        // дублирования целей между разными типами юнитов.
        const globalClaimed = new Set<string>();
        const slotKey = (s: { x: number; y: number }) => `${s.x},${s.y}`;

        for (const type of ['sporomet', 'eblekar', 'champigneb'] as const) {
            const alive = this.army.units
                .filter(u => u.isAlive && u.type === type)
                .sort((a, b) => a.guid.localeCompare(b.guid));
            const typeSlots = slots[type].slice().sort((a, b) => a.x - b.x || a.y - b.y);

            const slotMap = new Map<string, { x: number; y: number }>();
            for (const s of typeSlots) slotMap.set(slotKey(s), s);

            // Сначала сохраняем предыдущие валидные цели (если они ещё доступны и не заняты)
            const claimedByThisType = new Set<string>();
            for (const u of alive) {
                if (!u.formationTarget) continue;
                const k = slotKey(u.formationTarget);
                if (slotMap.has(k) && !globalClaimed.has(k) && !claimedByThisType.has(k)) {
                    claimedByThisType.add(k);
                    globalClaimed.add(k);
                } else {
                    u.formationTarget = null;
                }
            }

            // Выдаём свободные слоты в отсортированном порядке, чтобы позиции были стабильны
            const freeSlots = typeSlots.filter(s => !globalClaimed.has(slotKey(s)));
            let freeIdx = 0;
            for (const u of alive) {
                if (u.formationTarget) continue;
                while (freeIdx < freeSlots.length && globalClaimed.has(slotKey(freeSlots[freeIdx]))) freeIdx++;
                if (freeIdx < freeSlots.length) {
                    const s = freeSlots[freeIdx++];
                    u.formationTarget = { x: s.x, y: s.y };
                    globalClaimed.add(slotKey(s));
                } else {
                    u.formationTarget = null;
                }
            }
        }

        // После назначения целей — гарантируем, что юниты не окажутся на одинаковых
        // тайлах в текущем положении. Если коллизии есть — пытаемся перетащить
        // лишние юниты на ближайшие свободные тайлы внутри зоны базы.
        this.resolveCollisionsNearBase();
    }

    // Ищет ближайшую свободную клетку (по BFS) внутри заданной зоны и не занятую другими юнитами.
    private findNearestFreeTile(startX: number, startY: number, minX: number, minY: number, maxX: number, maxY: number): { x: number; y: number } | null {
        const map = this.army.map;
        const rows = map.length;
        const cols = map[0]?.length ?? 0;
        const key = (x: number, y: number) => `${x},${y}`;

        const occupied = new Set<string>(this.army.units.filter(u => u.isAlive).map(u => `${u.x},${u.y}`));

        const inZone = (x: number, y: number) => x >= minX && y >= minY && x <= maxX && y <= maxY;

        const q: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
        const seen = new Set<string>([key(startX, startY)]);
        const NEI = [[0,0],[1,0],[-1,0],[0,1],[0,-1]] as const;

        while (q.length) {
            const p = q.shift()!;
            if (inZone(p.x, p.y) && map[p.y]?.[p.x] === 0 && !occupied.has(key(p.x, p.y))) return p;
            for (const [dx, dy] of NEI) {
                const nx = p.x + dx, ny = p.y + dy;
                const k = key(nx, ny);
                if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
                if (seen.has(k)) continue;
                seen.add(k);
                q.push({ x: nx, y: ny });
            }
        }
        return null;
    }

    // Разрешает коллизии текущих позиций юнитов: если несколько юнитов в одной клетке,
    // перемещаем лишних на ближайшие свободные тайлы внутри правого-нижнего блока базы.
    private resolveCollisionsNearBase(): void {
        const map = this.army.map;
        if (!map || map.length === 0) return;
        const rows = map.length;
        const cols = map[0].length;
        const zoneX0 = Math.max(0, cols - 15);
        const zoneY0 = Math.max(0, rows - 15);
        const zoneX1 = cols - 1;
        const zoneY1 = rows - 1;

        const posMap = new Map<string, any[]>();
        for (const u of this.army.units) {
            if (!u.isAlive) continue;
            // Не трогаем разведчиков — они должны свободно перемещаться для разведки
            if (u.type === 'pizdoglyad') continue;
            const k = `${u.x},${u.y}`;
            const arr = posMap.get(k) ?? [] as any[];
            arr.push(u);
            posMap.set(k, arr);
        }

        for (const [k, arr] of posMap.entries()) {
            if (arr.length <= 1) continue;
            // Первый остаётся, остальные — ищем свободную клетку и перемещаем.
            for (let i = 1; i < arr.length; i++) {
                const u = arr[i];
                const free = this.findNearestFreeTile(u.x, u.y, zoneX0, zoneY0, zoneX1, zoneY1);
                if (free) {
                    u.x = free.x;
                    u.y = free.y;
                } else {
                    // Если не нашли внутри зоны — ищем вокруг текущей позиции по карте целиком
                    const freeGlobal = this.findNearestFreeTile(u.x, u.y, 0, 0, cols - 1, rows - 1);
                    if (freeGlobal) { u.x = freeGlobal.x; u.y = freeGlobal.y; }
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

    /**
     * Возвращает текущее состояние формации для отрисовки в UI: центр и
     * все слоты по эшелонам (после фильтра карты). Клиент использует это
     * чтобы нарисовать рамку и пустые маркеры слотов поверх юнитов.
     */
    public getFormationState(): TFormationState | null {
        return null;
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
