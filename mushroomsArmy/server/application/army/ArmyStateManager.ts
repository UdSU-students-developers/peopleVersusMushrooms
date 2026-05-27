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

            // Синхронизируем скорость сразу 
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

            // Строим полукруг вокруг центра масс группы лицом в сторону марша
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
                    u.leashRadius = Infinity;
                    u.formationTarget = null;
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
                            x: Math.max(0, Math.round(slotOffsetX)), // слоты не уходят за карту
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

        // Обычный/оборонительный режим
        const isDefense = this.metrics.currentMode === 'defense';
        for (const u of aliveUnits) {
            u.currentSpeed = u.speed;
            u.formationHold = false;
            // В режиме обороны — ограничиваем поводок: юниты атакуют врагов,
            // подошедших близко, но не уходят далеко от своего слота в строю.
            u.leashRadius = isDefense ? 10 : Infinity;
        }

        const slots = planner.updateForCounts(counts, { defenseHold: isDefense });
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
        // Больше не строим внешние уровни обороны и не расставляем башни за пределами базы.
        // Оборона должна оставаться только внутри стартового правого нижнего угла.
        // Дополнительно: гарантируем, что в режиме обороны юниты остаются внутри системы
        // обороны: `sporomet` и `eblekar` держатся позади стены, `champigneb` — рядом
        // со стеной. `pizdoglyad` не трогаем логикой формирования (но оставляем их в
        // режиме обороны по общему флагу).
        if (this.metrics.currentMode === 'defense') {
            const map = this.army.map;
            const rows = map.length;
            const cols = map[0]?.length ?? 0;
            const baseWallTopY = Math.max(0, rows - 15);
            const baseWallLeftX = Math.max(0, cols - 15);

            const champSlots = planner.getSlots('champigneb');
            const sporSlots = planner.getSlots('sporomet');
            const ebleSlots = planner.getSlots('eblekar');
            // Дополнительный отступ внутрь базы (чем больше, тем глубже от стены).
            const BASE_BACKOFF = 3;

            const pickNearestSlot = (slots: ReadonlyArray<{ x: number; y: number }>, x: number, y: number) => {
                if (!slots || slots.length === 0) return null;
                let best = slots[0];
                let bestDist = Infinity;
                for (const s of slots) {
                    const dx = s.x - x, dy = s.y - y;
                    const d = dx * dx + dy * dy;
                    if (d < bestDist) { best = s; bestDist = d; }
                }
                return best;
            };

            

            for (const u of this.army.units) {
                if (!u.isAlive) continue;
                // Пиздогляды используют свою собственную логику разведки из Pizdoglyad.ts
                // Не вмешиваемся в их поведение
                if (u.type === 'pizdoglyad') {
                    u.formationHold = false;
                    u.leashRadius = Infinity;
                    u.formationTarget = null;
                    continue;
                }

                if (u.type === 'sporomet' || u.type === 'eblekar') {
                    // гарантируем, что слот глубже внутри базы (backoff от стены)
                    u.formationHold = true;
                    u.leashRadius = 2;
                    const minX = baseWallLeftX + 1 + BASE_BACKOFF;
                    const minY = baseWallTopY + 1 + BASE_BACKOFF;
                    if (!u.formationTarget) {
                        const slots = u.type === 'sporomet' ? sporSlots : ebleSlots;
                        // фильтруем слоты глубже внутри базы
                        const inside = slots.filter(s => s.x >= minX && s.y >= minY);
                        const pick = pickNearestSlot(inside.length ? inside : slots, u.x, u.y);
                        if (pick) u.formationTarget = { x: pick.x, y: pick.y };
                    } else {
                        if (u.formationTarget.x < minX) u.formationTarget.x = minX;
                        if (u.formationTarget.y < minY) u.formationTarget.y = minY;
                    }
                    continue;
                }

                if (u.type === 'champigneb') {
                    // шампиньебы — рядом со стеной (приближаемся к ближайшему слоту champ)
                    u.formationHold = true;
                    u.leashRadius = 4;
                    if (!u.formationTarget) {
                        const pick = pickNearestSlot(champSlots, u.x, u.y);
                        if (pick) u.formationTarget = { x: pick.x, y: pick.y };
                    }
                    // дополнительно стараемся держать их ближе к стене: если слот далеко,
                    // ограничиваем отклонение (не позволяем уходить внутрь более чем на 3 клетки)
                    if (u.formationTarget) {
                        const maxInner = 2; // шампиньебы ближе к стене
                        const capX = baseWallLeftX + 1 + BASE_BACKOFF + maxInner;
                        const capY = baseWallTopY + 1 + BASE_BACKOFF + maxInner;
                        if (u.formationTarget.x > capX) u.formationTarget.x = capX;
                        if (u.formationTarget.y > capY) u.formationTarget.y = capY;
                    }
                }
            }
        }
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
            // Пробуем слот и ближайших соседей если непроходимо
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
            const alive = this.army.units.filter(u => u.isAlive && u.type === type);
            const typeSlots = slots[type];

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

            // Выдаём свободные слоты в порядке очереди, пропуская уже занятые глобально
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
