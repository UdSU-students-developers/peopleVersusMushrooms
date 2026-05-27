import { TMap } from "../../Army";
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

    private currentMode: 'panic' | 'watch' | 'scout' = 'scout';

    constructor(options: TUnitOptions) {
        super({ ...options, hp: 2, speed: 7, attackRange: 0 });
        this.baseHp = 2;
        this.visibility = 28;
        this.DECISION_INTERVAL = 0.3;
    }

    protected onEnemyFound(enemy: Unit, distance: number): void {
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

        // Враг дальше WATCH_MAX — сближаемся до зоны наблюдения
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

    public update(enemies: Unit[], map: TMap, deltaTime: number, allies: Unit[] = []): void {
        if (!this.isAlive) return;

        this.lastAllies = allies;
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

        const nearestEnemy = this.findNearestEnemy(enemies);

        if (nearestEnemy) {
            const dx = nearestEnemy.x - this.x;
            const dy = nearestEnemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.onEnemyFound(nearestEnemy, distance);
        } else {

            this.onNoEnemy(map);
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
     * Если карта полностью разведана — случайная проходимая точка.
     */
    private findUnexploredPoint(map: TMap): { x: number; y: number } | null {
        const rows = map.length;
        const cols = map[0]?.length ?? 0;
        if (!rows || !cols) return null;

        let bestX = -1;
        let bestY = -1;
        let bestDist = Infinity;

        for (let y = 0; y < rows; y += 3) {
            for (let x = 0; x < cols; x += 3) {
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

                const dist = Math.hypot(x - this.x, y - this.y);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestX = x;
                    bestY = y;
                }
            }
        }

        if (bestX !== -1) return { x: bestX, y: bestY };

        // Туман рассеян полностью — случайная точка
        for (let i = 0; i < 20; i++) {
            const rx = Math.floor(Math.random() * cols);
            const ry = Math.floor(Math.random() * rows);
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
