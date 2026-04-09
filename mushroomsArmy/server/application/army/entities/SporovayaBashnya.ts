import Unit from "./Units";

type TSporovayaBashnyaOptions = {
    guid: string;
    type: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
};

class SporovayaBashnya {
    public guid: string;
    public type: string;
    public x: number;
    public y: number;
    public hp: number;
    public maxHp: number;
    public readonly sizeX: number = 2;
    public readonly sizeY: number = 2;

    private readonly attackRange: number = 10;
    private readonly attackCooldown: number = 2;
    private readonly attackDamage: number = 25;
    private attackTimer: number = 0;

    constructor(options: TSporovayaBashnyaOptions) {
        this.guid = options.guid;
        this.type = options.type;
        this.x = options.x;
        this.y = options.y;
        this.hp = options.hp;
        this.maxHp = options.maxHp;
    }

    public update(enemies: Unit[], deltaTime: number): void {
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
            nearestEnemy.takeDamage(this.attackDamage, 'physical');
        }
    }

    public getState() {
        return {
            guid: this.guid,
            type: this.type,
            x: this.x,
            y: this.y,
            hp: this.hp,
            maxHp: this.maxHp,
            sizeX: this.sizeX,
            sizeY: this.sizeY,
        };
    }
}

export default SporovayaBashnya;