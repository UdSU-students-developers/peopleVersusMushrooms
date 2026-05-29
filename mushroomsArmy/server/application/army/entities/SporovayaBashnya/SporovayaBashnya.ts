import { TMap } from "../../Army";
import Unit, { TProjectile, ProjectileType } from "../Units";
import { IBuilding } from "../Vzryvomor/Vzryvomor";

type TSporovayaBashnyaOptions = {
    guid: string;
    x: number;
    y: number;
    hp?: number;
    projectiles?: TProjectile[];
};

type TSporovayaBashnyaState = {
    guid: string;
    type: string;
    x: number;
    y: number;
    hp: number;
    sizeX: number;
    sizeY: number;
    isAlive: boolean;
    isAttacking: boolean;
    visibility?: number;
};

class SporovayaBashnya implements IBuilding<TSporovayaBashnyaState> {
    public guid: string;
    public type: string = 'sporovaya_bashnya';
    public x: number;
    public y: number;
    public hp: number;
    public readonly sizeX: number = 2;
    public readonly sizeY: number = 2;

    public isAlive: boolean = true;
    public isAttacking: boolean = false;
    private attackingTimer: number = 0;          // сколько секунд ещё показывать флаг атаки
    private readonly attackAnimDuration: number = 0.6; // держим флаг 600ms
    private readonly attackRange: number = 20;
    private readonly attackCooldown: number = 2;
    private readonly attackDamage: number = 15;
    private attackTimer: number = 0;
    private projectiles: TProjectile[] = [];

    // Регенерация HP
    private readonly maxHp: number = 200;
    private readonly healCooldown: number = 10; // секунд до начала регенерации
    private readonly healRate: number = 5; // HP в секунду
    private lastDamageTime: number = 0; // время последнего получения урона
    private healAccumulator: number = 0; // накопленное время для регенерации
    public visibility: number = 20; // 20 клеток видимости

    constructor(options: TSporovayaBashnyaOptions) {
        this.guid = options.guid;
        this.x = options.x;
        this.y = options.y;
        this.hp = options.hp ?? 200;
        this.projectiles = options.projectiles ?? [];
    }

    public update(enemies: Unit[], map: TMap, deltaTime: number): void {
        if (!this.isAlive) return;

        // Регенерация HP
        this.healAccumulator += deltaTime;
        const timeSinceLastDamage = Date.now() / 1000 - this.lastDamageTime;

        if (timeSinceLastDamage >= this.healCooldown && this.hp < this.maxHp) {
            // Регенерируем каждые 1 секунду
            const healIntervals = Math.floor(this.healAccumulator);
            if (healIntervals >= 1) {
                const healAmount = healIntervals * this.healRate;
                this.hp = Math.min(this.maxHp, this.hp + healAmount);
                this.healAccumulator -= healIntervals;
            }
        } else {
            // Сбрасываем аккумулятор если получен урон или HP полное
            this.healAccumulator = 0;
        }

        // Обратный отсчёт флага анимации атаки
        if (this.attackingTimer > 0) {
            this.attackingTimer -= deltaTime;
            if (this.attackingTimer <= 0) {
                this.isAttacking = false;
                this.attackingTimer = 0;
            }
        }

        this.attackTimer += deltaTime;
        if (this.attackTimer < this.attackCooldown) return;

        this.attackTimer = 0;

        let nearestEnemy: Unit | null = null;
        let nearestDistance: number = Infinity;

        for (const enemy of enemies) {
            if (!enemy.isAlive) continue;

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= this.attackRange && distance < nearestDistance) {
                nearestEnemy = enemy;
                nearestDistance = distance;
            }
        }

        if (!nearestEnemy) {
            return;
        }

        this.isAttacking = true;
        this.attackingTimer = this.attackAnimDuration;
        this.projectiles.push({
            guid: `${this.guid}-${Date.now()}-${Math.random()}`,
            type: ProjectileType.SPOROVAYA_BASHNYA,
            fromX: this.x + 1,
            fromY: this.y + 1,
            toX: nearestEnemy.x,
            toY: nearestEnemy.y,
            createdAt: Date.now(),
        });
        nearestEnemy.takeDamage(this.attackDamage);
    }

    public takeDamage(amount: number): void {
        if (!this.isAlive) return;
        const finalAmount = Math.max(0, amount);
        this.hp -= finalAmount;

        // Сбрасываем таймер регенерации при получении урона
        if (finalAmount > 0) {
            this.lastDamageTime = Date.now() / 1000;
            this.healAccumulator = 0;
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.isAlive = false;
        }
    }

    public getState(): TSporovayaBashnyaState {
        return {
            guid: this.guid,
            type: this.type,
            x: this.x,
            y: this.y,
            hp: this.hp,
            sizeX: this.sizeX,
            sizeY: this.sizeY,
            isAlive: this.isAlive,
            isAttacking: this.isAttacking,
            visibility: this.visibility,
        };
    }
}

export default SporovayaBashnya;
