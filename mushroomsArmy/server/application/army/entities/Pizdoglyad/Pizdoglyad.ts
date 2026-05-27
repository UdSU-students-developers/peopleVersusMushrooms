import { TMap, TBuildingInput } from "../../Army";
import Unit, { TUnitOptions } from "../Units";

class Pizdoglyad extends Unit {
    public visionRadius: number = 28;

    private readonly WATCH_MIN: number  = 22;
    private readonly WATCH_MAX: number  = 25;
    private readonly PANIC_RANGE: number = 12;

    private scoutTarget: { x: number; y: number } | null = null;
    private scoutCooldown: number = 0;
    private readonly SCOUT_COOLDOWN: number = 2;

    /** Союзники, переданные снаружи через update() */
    private lastAllies: Unit[] = [];
    /** Экономические здания людей, переданные снаружи через update() */
    private lastEconomyBuildings: TBuildingInput[] = [];
    /** Экономические юниты людей, переданные снаружи через update() */
    private lastEconomyUnits: TBuildingInput[] = [];

    /** Индекс зоны разведки (0, 1, 2) или -1 если следует за еблекаром */
    private scoutZoneIndex: number = 0;
    /** Еблекар, за которым следует этот пиздогляд (если scoutZoneIndex === -1) */
    private assignedEblekar: Unit | null = null;

    private currentMode: 'panic' | 'watch' | 'scout' | 'follow_eblekar' = 'scout';

    constructor(options: TUnitOptions, scoutZoneIndex: number = 0) {
        super({ ...options, hp: 2, speed: 7, attackRange: 0 });
        this.baseHp = 2;
        this.visibility = 28;
        this.DECISION_INTERVAL = 0.3;
        this.scoutZoneIndex = scoutZoneIndex;
    }

    protected onEnemyFound(enemy: Unit, distance: number): void {
        // Пиздогляды с индексом >= 3 следуют за еблекаром и не реагируют на врагов
        if (this.scoutZoneIndex >= 3) {
            return;
        }

        // Проверяем, находится ли враг в зоне ответственности пиздогляда
        const zoneCenters = [
            { x: 0, y: 15 },
            { x: 15, y: 15 },
            { x: 15, y: 0 },
        ];
        const zoneCenter = zoneCenters[this.scoutZoneIndex % zoneCenters.length];
        const zoneRadius = 15; // Радиус зоны ответственности

        const distToZoneCenter = Math.hypot(enemy.x - zoneCenter.x, enemy.y - zoneCenter.y);

        // Если враг далеко от зоны ответственности - игнорируем, продолжаем разведку
        if (distToZoneCenter > zoneRadius) {
            // Враг вне зоны - просто сбрасываем scoutTarget, чтобы выбрать новую точку в зоне
            this.scoutTarget = null;
            this.currentMode = 'scout';
            return;
        }

        if (distance <= this.PANIC_RANGE) {
            this.currentMode = 'panic';
            const safePoint = this.findSafePoint();
            if (safePoint) {
                this.targetX = safePoint.x;
                this.targetY = safePoint.y;
            } else {
                const dx = this.x - enemy.x;
                const dy = this.y - enemy.y;
                const norm = Math.sqrt(dx * dx + dy * dy) || 1;
                this.targetX = this.x + (dx / norm) * 20;
                this.targetY = this.y + (dy / norm) * 20;
            }
            this.scoutTarget = null;
            return;
        }

        if (distance <= this.WATCH_MAX) {
            this.currentMode = 'watch';
            if (distance < this.WATCH_MIN) {
                // Чуть отходим назад к нижней границе диапазона
                const dx = this.x - enemy.x;
                const dy = this.y - enemy.y;
                const norm = Math.sqrt(dx * dx + dy * dy) || 1;
                const retreat = this.WATCH_MIN - distance + 0.5;
                this.targetX = this.x + (dx / norm) * retreat;
                this.targetY = this.y + (dy / norm) * retreat;
            } else {
                // Стоим на месте — «светим»
                this.targetX = this.x;
                this.targetY = this.y;
            }
            this.scoutTarget = null;
            return;
        }

        // Враг дальше WATCH_MAX, но в зоне ответственности — сближаемся до зоны наблюдения
        this.currentMode = 'watch';
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const norm = Math.sqrt(dx * dx + dy * dy) || 1;
        this.targetX = this.x + (dx / norm) * (distance - this.WATCH_MIN);
        this.targetY = this.y + (dy / norm) * (distance - this.WATCH_MIN);
        this.scoutTarget = null;
    }

    private onNoEnemy(map: TMap): void {
        this.currentMode = 'scout';
        this.scoutCooldown -= this.lastDeltaTime || 0.3;
        this.doScout(map);
    }

    private updateFollowEblekar(allies: Unit[], map: TMap, deltaTime: number): void {
        this.currentMode = 'follow_eblekar';

        // Если назначенный еблекар умер или не существует, ищем нового
        if (!this.assignedEblekar || !this.assignedEblekar.isAlive) {
            this.assignedEblekar = this.findUnassignedEblekar(allies);
        }

        if (this.assignedEblekar) {
            // Стоим на одну клетку вниз и правее еблекара
            const targetX = this.assignedEblekar.x + 1;
            const targetY = this.assignedEblekar.y + 1;

            // Проверяем, проходима ли целевая клетка
            const mapRows = map.length;
            const mapCols = map[0]?.length ?? 0;
            const targetTileX = Math.floor(targetX);
            const targetTileY = Math.floor(targetY);

            if (targetTileX >= 0 && targetTileX < mapCols && targetTileY >= 0 && targetTileY < mapRows) {
                const tile = map[targetTileY][targetTileX];
                if (tile === 0 || tile === 2) {
                    // Клетка проходима - идем туда
                    this.targetX = targetX;
                    this.targetY = targetY;
                } else {
                    // Клетка непроходима - стоим на месте
                    this.targetX = this.x;
                    this.targetY = this.y;
                }
            } else {
                // За пределами карты - стоим на месте
                this.targetX = this.x;
                this.targetY = this.y;
            }
        } else {
            // Еблекаров нет - стоим на месте
            this.targetX = this.x;
            this.targetY = this.y;
        }
    }

    private findUnassignedEblekar(allies: Unit[]): Unit | null {
        // Находим всех еблекаров
        const eblekars = allies.filter(u => u.type === 'eblekar' && u.isAlive);
        if (eblekars.length === 0) return null;

        // Проверяем, какие еблекары уже имеют назначенных пиздоглядов
        // Для этого используем простой подход: распределяем по round-robin
        const pizdoglyads = allies.filter(u => u.type === 'pizdoglyad' && u.isAlive && (u as any).scoutZoneIndex >= 3);
        const myIndex = this.scoutZoneIndex - 3; // 0, 1, 2, ... для пиздоглядов с индексом >= 3

        // Распределяем еблекаров циклически
        const assignedIndex = myIndex % eblekars.length;
        return eblekars[assignedIndex];
    }

    public update(enemies: Unit[], map: TMap, deltaTime: number, allies: Unit[] = [], economyBuildings: TBuildingInput[] = [], economyUnits: TBuildingInput[] = []): void {
        if (!this.isAlive) return;

        this.lastAllies = allies;
        this.lastEconomyBuildings = economyBuildings;
        this.lastEconomyUnits = economyUnits;
        this.lastDeltaTime = deltaTime;

        if (this.formationHold) {
            const safePoint = this.findSafePoint();
            if (safePoint) {
                this.targetX = safePoint.x;
                this.targetY = safePoint.y;
            } else if (this.formationTarget) {
                this.targetX = this.formationTarget.x;
                this.targetY = this.formationTarget.y;
            } else {
                this.targetX = this.x;
                this.targetY = this.y;
            }
            this.pizdoglyadMoveOnly(map, deltaTime);
            return;
        }

        // Если индекс >= 3, следуем за еблекаром
        if (this.scoutZoneIndex >= 3) {
            this.updateFollowEblekar(allies, map, deltaTime);
            this.pizdoglyadMoveOnly(map, deltaTime);
            return;
        }

        const nearestEnemy = this.findNearestEnemy(enemies);

        if (nearestEnemy) {
            const dx = nearestEnemy.x - this.x;
            const dy = nearestEnemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.onEnemyFound(nearestEnemy, distance);
        } else {
            // Пиздогляды с индексом >= 3 не разведывают
            if (this.scoutZoneIndex < 3) {
                this.onNoEnemy(map);
            }
        }
        this.pizdoglyadMoveOnly(map, deltaTime);
    }


    private pizdoglyadMoveOnly(map: TMap, deltaTime: number): void {
        this.moveTo(this.targetX, this.targetY, map, deltaTime);
    }

    private doScout(map: TMap): void {
        const atTarget =
            !this.scoutTarget ||
            (Math.abs(this.x - this.scoutTarget.x) < 1.5 &&
             Math.abs(this.y - this.scoutTarget.y) < 1.5);

        if (atTarget && this.scoutCooldown <= 0) {
            this.scoutTarget = this.findUnexploredPoint(map);
            this.scoutCooldown = this.SCOUT_COOLDOWN;
        }

        if (this.scoutTarget) {
            this.targetX = this.scoutTarget.x;
            this.targetY = this.scoutTarget.y;
        }
    }

    /**
     * Ищет ближайший проходимый тайл на границе тумана войны (рядом с null).
     * Ограничивает поиск зоной ответственности пиздогляда.
     * Зоны:
     * - Индекс 0: центр (0, 15) - левая середина
     * - Индекс 1: центр (15, 15) - центр карты
     * - Индекс 2: центр (15, 0) - верхняя середина
     * - Индекс >= 3: следует за еблекаром, не разведывает
     * Приоритет точкам рядом с экономическими зданиями людей.
     * Если карта полностью разведана в зоне — случайная точка в зоне.
     */
    private findUnexploredPoint(map: TMap): { x: number; y: number } | null {
        // Пиздогляды с индексом >= 3 не разведывают
        if (this.scoutZoneIndex >= 3) {
            return null;
        }

        const rows = map.length;
        const cols = map[0]?.length ?? 0;
        if (!rows || !cols) return null;

        // Определяем зону ответственности по индексу
        const zoneCenters = [
            { x: 0, y: 15 },   // Индекс 0: левая середина
            { x: 15, y: 15 },  // Индекс 1: центр
            { x: 15, y: 0 },   // Индекс 2: верхняя середина
        ];

        const zoneCenter = zoneCenters[this.scoutZoneIndex % zoneCenters.length];
        const zoneRadius = 12; // Радиус зоны разведки

        // Границы зоны
        const zoneMinX = Math.max(0, zoneCenter.x - zoneRadius);
        const zoneMaxX = Math.min(cols - 1, zoneCenter.x + zoneRadius);
        const zoneMinY = Math.max(0, zoneCenter.y - zoneRadius);
        const zoneMaxY = Math.min(rows - 1, zoneCenter.y + zoneRadius);

        // Собираем все экономические объекты людей для приоритизации
        const economyTargets: { x: number; y: number }[] = [];
        for (const building of this.lastEconomyBuildings) {
            economyTargets.push({ x: building.x, y: building.y });
        }
        for (const unit of this.lastEconomyUnits) {
            economyTargets.push({ x: unit.x, y: unit.y });
        }

        let bestX = -1;
        let bestY = -1;
        let bestScore = -Infinity;

        for (let y = zoneMinY; y <= zoneMaxY; y += 3) {
            for (let x = zoneMinX; x <= zoneMaxX; x += 3) {
                const tile = map[y][x];
                if (tile !== 0 && tile !== 2) continue;

                let hasFog = false;
                outer:
                for (let dy = -3; dy <= 3; dy++) {
                    for (let dx = -3; dx <= 3; dx++) {
                        const ny = y + dy;
                        const nx = x + dx;
                        if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && map[ny][nx] === null) {
                            hasFog = true;
                            break outer;
                        }
                    }
                }

                if (!hasFog) continue;

                // Базовый score: расстояние до текущей позиции (чем ближе, тем лучше)
                const dist = Math.hypot(x - this.x, y - this.y);
                let score = -dist;

                // Бонус за близость к экономическим объектам людей
                for (const target of economyTargets) {
                    const econDist = Math.hypot(x - target.x, y - target.y);
                    if (econDist < 15) {
                        score += (15 - econDist) * 2; // Чем ближе к экономике, тем выше приоритет
                    }
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestX = x;
                    bestY = y;
                }
            }
        }

        if (bestX !== -1) return { x: bestX, y: bestY };

        // Туман рассеян полностью в зоне — случайная точка в зоне
        for (let i = 0; i < 20; i++) {
            const rx = zoneMinX + Math.floor(Math.random() * (zoneMaxX - zoneMinX + 1));
            const ry = zoneMinY + Math.floor(Math.random() * (zoneMaxY - zoneMinY + 1));
            if (map[ry][rx] === 0 || map[ry][rx] === 2) return { x: rx, y: ry };
        }

        return null;
    }

    private findNearestEnemy(enemies: Unit[]): Unit | null {
        let best: Unit | null = null;
        let bestDist = Infinity;
        for (const e of enemies) {
            if (!e.isAlive) continue;
            const d = Math.hypot(e.x - this.x, e.y - this.y);
            if (d < bestDist) { bestDist = d; best = e; }
        }
        return best;
    }

    //Ближайший живой союзник
    private findSafePoint(): { x: number; y: number } | null {
        const candidates = this.lastAllies.filter(
            u => u.isAlive && u.guid !== this.guid && u.type !== 'pizdoglyad'
        );
        if (!candidates.length) return null;

        let best: Unit | null = null;
        let bestDist = Infinity;
        for (const ally of candidates) {
            const d = Math.hypot(ally.x - this.x, ally.y - this.y);
            if (d < bestDist) { bestDist = d; best = ally; }
        }
        return best ? { x: best.x, y: best.y } : null;
    }

    protected onDeath(): void {}
}

export default Pizdoglyad;
