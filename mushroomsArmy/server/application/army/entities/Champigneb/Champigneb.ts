import Unit, { TUnitOptions } from "../Units";

export type TSlimePuddle = {
  x: number;
  y: number;
  radius: number;
  ttl: number;
};

class Champigneb extends Unit {

    public explosionRadius: number = 6;
    public explosionDamage: number = 60;
    public slimeDuration: number = 10;
    public slimePuddle: TSlimePuddle = { x: 0, y: 0, radius: 0, ttl: 0 };
    public hasExploded: boolean = false;

    constructor(options: TUnitOptions) {
        super(options);
        this.hp = 35;
        this.maxHp = 35;
        this.speed = options.speed ?? 3;
        this.attackRange = options.attackRange ?? 6;
    }

    protected explode(): void {

        if(this.hasExploded) return;

        for (const enemy of this.enemies){

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < this.explosionRadius){
                enemy.takeDamage(this.explosionDamage);
            }
        }

        this.slimePuddle = { 
            x: this.x,
            y: this.y,
            radius: this.explosionRadius,
            ttl: this.slimeDuration
        };
        
        this.hasExploded = true;
        this.hp = 0; // Клиент определяет смерть по hp === 0, поэтому обнуляем явно
        this.die();
    }

    protected onEnemyFound(enemy: Unit, distance: number): void {
        this.targetX = enemy.x;
        this.targetY = enemy.y;
        if (distance < 6) {
            this.explode();
        }
    }

    public takeDamage(amount: number): void {
        if (!this.isAlive) return;
        super.takeDamage(amount);
    }

    protected onDeath(): void {
        if(!this.hasExploded){
            this.explode();
        }
    }
}

export default Champigneb;