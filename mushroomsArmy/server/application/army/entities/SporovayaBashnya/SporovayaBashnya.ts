import { TMap } from "../../Army";
import Unit, { TProjectile } from "../Units";
import { IBuilding } from "../Vzryvomor/Vzryvomor";

type TSporovayaBashnyaOptions = {
    guid: string;
    type: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    projectiles?: TProjectile[];
};

type TSporovayaBashnyaState = {
    guid: string;
    type: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    sizeX: number;
    sizeY: number;
    isAlive: boolean;
    isAttacking: boolean;
};

class SporovayaBashnya implements IBuilding<TSporovayaBashnyaState> {
    public guid: string;
    public type: string;
    public x: number;
    public y: number;
    public hp: number;
    public maxHp: number;
    public readonly sizeX: number = 2;
    public readonly sizeY: number = 2;

    public isAlive: boolean = true;
    public isAttacking: boolean = false;
    private attackingTimer: number = 0;          // сколько секунд ещё показывать флаг атаки
    private readonly attackAnimDuration: number = 0.6; // держим флаг 600ms
    private readonly attackRange: number = 20;
    private readonly attackCooldown: number = 2;
    private readonly attackDamage: number = 50;
    private attackTimer: number = 0;
    private projectiles: TProjectile[] = [];

    constructor(options: TSporovayaBashnyaOptions) {
        this.guid = options.guid;
        this.type = options.type;
        this.x = options.x;
        this.y = options.y;
        this.hp = options.hp;
        this.maxHp = options.maxHp;
        this.projectiles = options.projectiles ?? [];
    }

    public update(enemies: Unit[], map: TMap, deltaTime: number): void {
        if (!this.isAlive) return;

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

        if (nearestEnemy) {
            this.isAttacking = true;
            this.attackingTimer = this.attackAnimDuration;
            this.projectiles.push({
                guid: `${this.guid}-${Date.now()}-${Math.random()}`,
                type: 'sporovaya_bashnya',
                fromX: this.x + 1,
                fromY: this.y + 1,
                toX: nearestEnemy.x,
                toY: nearestEnemy.y,
                createdAt: Date.now(),
            });
            nearestEnemy.takeDamage(this.attackDamage, 'physical');
        }
    }

    public takeDamage(amount: number, type: string = 'physical'): void {
        if (!this.isAlive) return;
        const finalAmount = Math.max(0, amount);
        this.hp -= finalAmount;
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
        maxHp: this.maxHp,
        sizeX: this.sizeX,
        sizeY: this.sizeY,
        isAlive: this.isAlive,
        isAttacking: this.isAttacking,
    };
}
}

export default SporovayaBashnya;
