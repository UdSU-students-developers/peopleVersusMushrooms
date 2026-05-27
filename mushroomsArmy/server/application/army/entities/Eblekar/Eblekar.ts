import { TMap } from "../../Army";
import Unit, { TUnitOptions, TUnitState, ProjectileType } from "../Units";

class Eblekar extends Unit {
    public healRange: number = 10;
    public healCooldown: number = 3;
    public healAmount: number = 15;
    public aimTime: number = 0.5;

    private isAiming: boolean = false;
    private aimStartTime: number = 0;
    private lastHealTime: number = -3;
    private currentAllyTarget: Unit | null = null;
    // Поля для таймера решений союзников названы с префиксом ally, чтобы не конфликтовать
    // с приватными полями базового Unit (decisionAccumulator, DECISION_INTERVAL).
    private allyDecisionAccumulator: number = 0;
    private readonly ALLY_DECISION_INTERVAL: number = 0.5;

    constructor(options: TUnitOptions) {
        super(options);
        this.visibility = options.visibility ?? 12;
        this.hp = 20;
        this.baseHp = 20;
        this.speed = options.speed ?? 1;
        this.attackRange = options.attackRange ?? 0;
        this.lastHealTime = -this.healCooldown;
    }

    public update(enemies: Unit[], map: TMap, deltaTime: number, allies: Unit[] = []): void {
        if (!this.isAlive) return;

        if (this.formationHold && this.formationTarget) {
            this.targetX = this.formationTarget.x;
            this.targetY = this.formationTarget.y;
            this.moveTo(this.targetX, this.targetY, map, deltaTime);
            return;
        }

        this.enemies = enemies;
        this.allyDecisionAccumulator += deltaTime;

        if (this.allyDecisionAccumulator >= this.ALLY_DECISION_INTERVAL) {
            this.allyDecisionAccumulator = 0;
            this.makeAllyDecision(allies, map);
        }

        this.moveTo(this.targetX, this.targetY, map, deltaTime);

        if (!this.isAiming || !this.currentAllyTarget) return;

        const ally = this.currentAllyTarget;
        const currentTime = Date.now() / 1000;
        const dx = ally.x - this.x;
        const dy = ally.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (
            !ally.isAlive ||
            !this.canHealAlly(ally) ||
            ally.hp >= ally.baseHp ||
            distance >= this.healRange ||
            !this.hasLineOfSight(this.x, this.y, ally.x, ally.y, map)
        ) {
            this.isAiming = false;
            this.currentAllyTarget = null;
            return;
        }

        if (currentTime - this.lastHealTime < this.healCooldown) return;

        if (currentTime - this.aimStartTime >= this.aimTime) {
             this.projectiles.push({
                guid: `${this.guid}-${Date.now()}-${Math.random()}`,
                type: ProjectileType.EBLEKAR,
                fromX: this.x,
                fromY: this.y,
                toX: ally.x,
                toY: ally.y,
                createdAt: Date.now(),
            });
            ally.hp = Math.min(ally.baseHp, ally.hp + this.healAmount);
            this.lastHealTime = currentTime;
            this.isAiming = false;
        }
    }

    private makeAllyDecision(allies: Unit[], map: TMap): void {
        let nearestAlly: Unit | null = null;
        let nearestDistance: number = Infinity;

        for (const ally of allies) {
            if (!ally.isAlive || ally.guid === this.guid) continue;
            if (!this.canHealAlly(ally)) continue;
            if (ally.hp >= ally.baseHp) continue;

            const dx = ally.x - this.x;
            const dy = ally.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < nearestDistance && this.hasLineOfSight(this.x, this.y, ally.x, ally.y, map)) {
                nearestDistance = distance;
                nearestAlly = ally;
            }
        }

        if (!nearestAlly) {
            this.currentAllyTarget = null;
            this.isAiming = false;
            if (this.formationTarget) {
                // Нет ally на лечение — возвращаемся в свой слот формации
                this.targetX = this.formationTarget.x;
                this.targetY = this.formationTarget.y;
            } else {
                this.targetX = this.x;
                this.targetY = this.y;
            }
            return;
        }

        const targetChanged = this.currentAllyTarget !== nearestAlly;
        this.currentAllyTarget = nearestAlly;

        if (nearestDistance < this.healRange) {
            this.targetX = this.x;
            this.targetY = this.y;

            if (!this.isAiming || targetChanged) {
                this.isAiming = true;
                this.aimStartTime = Date.now() / 1000;
            }

            return;
        }

        this.isAiming = false;
        this.targetX = nearestAlly.x;
        this.targetY = nearestAlly.y;
    }

    private canHealAlly(ally: Unit): boolean {
        return ally.type === 'sporomet' || ally.type === 'champigneb' || ally.type === 'eblekar';
    }

    public getState(): TUnitState {
        return {
            ...super.getState(),
            isHealing: this.isAiming,
        };
    }

    protected onDeath(): void {}
}

export default Eblekar;
