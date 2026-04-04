interface UnitConstructorOptions {
    guid: string;
    type: string;
    hp: number;
    maxHp: number;
    speed: number;
    x: number;
    y: number;
    attackRange: number;
    fireDamageMultiplier: number; 
}

interface UnitState {
  guid: string;
  type: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  isAlive: boolean;
}

interface MapData {
  map: (number | null)[][];
}

class Unit {
    public guid: string;
    public type: string;
    public hp: number;
    public maxHp: number;
    public speed: number;
    public x: number;
    public y: number;
    public targetX: number;
    public targetY: number;
    public isAlive: boolean;
    public attackRange: number;
    public fireDamageMultiplier: number = 2;
    protected enemies: Unit [] = [];

    private decisionAccumulator: number = 0;
    private readonly DECISION_INTERVAL: number = 0.5; 

    constructor({guid, type, x, y, hp, maxHp, speed, attackRange, fireDamageMultiplier = 2}: UnitConstructorOptions) {
        this.guid = guid;
        this.type = type;
        this.x = x;
        this.y = y;
        this.hp = hp;
        this.maxHp = maxHp;
        this.speed = speed;
        this.attackRange = attackRange;
        this.fireDamageMultiplier = fireDamageMultiplier;
        this.targetX = x;
        this.targetY = y;
        this.isAlive = true;
    }

    update(enemies: Unit[], mapData: MapData, deltaTime: number): void {
        if (!this.isAlive) return;
        
this.enemies = enemies;

        this.decisionAccumulator += deltaTime;
        
        if (this.decisionAccumulator >= this.DECISION_INTERVAL) {
            this.decisionAccumulator = 0;
            this.makeDecision(enemies);
        }
        
        this.moveTo(this.targetX, this.targetY, mapData, deltaTime);
    }
    
    private makeDecision(enemies: Unit[]): void {
        let nearestEnemy: Unit | null = null;
        let nearestDistance: number = Infinity;
        
        for (const enemy of enemies) {
            if (!enemy.isAlive) continue;
            
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        }
        
        if (nearestEnemy) {
            this.onEnemyFound(nearestEnemy, nearestDistance);
        } else {
            this.targetX = 25;
            this.targetY = 25;
        }
    }

    protected moveTo(targetX: number, targetY: number, mapData: MapData, deltaTime: number): void {
        if (!this.isAlive) return;

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.01) return;

        const step = this.speed * deltaTime;
        if (step >= distance) {
            this.x = targetX;
            this.y = targetY;
            return;
        }

        const stepX = (dx / distance) * step;
        const stepY = (dy / distance) * step;

        let newX = this.x + stepX;
        let newY = this.y + stepY;

        const map = mapData.map;

        // Округляем до индексов клетки
        const tileX = Math.floor(newX);
        const tileY = Math.floor(newY);

        // Проверяем границы карты
        if (tileY < 0 || tileY >= map.length || tileX < 0 || tileX >= map[0].length) {
            return;
        }

        const tile = map[tileY][tileX];

        // Грибы проходят по 0 (равнина) и 2 (горы). Вода (1) — смерть. null — непроходимо.
        if (tile === 1) {
            this.die();
            return;
        }

        if (tile === null || tile === undefined) {
            return;
        }
        
        this.x = newX;
        this.y = newY;
    }

   takeDamage(amount: number, type: string): void {
    if (!this.isAlive) return;

    // Огонь снимает яд с отравленного юнита
        if (type === 'fire' && (this as any).poisonEffects) {
            (this as any).poisonEffects = [];
        }

    const finalAmount = type === 'fire' ? amount * this.fireDamageMultiplier : amount;

    this.hp -= finalAmount;
    
    if (this.hp <= 0) {
        this.die();
    }
}

    die(): void {
        this.isAlive = false;
        this.onDeath();
    }
    
    getState(): UnitState {
        return {
            guid: this.guid,
            type: this.type,
            x: this.x,
            y: this.y,
            hp: this.hp,
            maxHp: this.maxHp,
            isAlive: this.isAlive,
        };
    }

    protected onDeath(): void {}
    protected onEnemyFound(enemy: Unit, distance: number): void {}
}

export default Unit;
