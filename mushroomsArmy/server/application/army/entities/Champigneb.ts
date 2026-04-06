import Unit, { UnitConstructorOptions } from "./Units";

export interface SlimePuddle {
  x: number;
  y: number;
  radius: number;
  ttl: number;
}

class Champigneb extends Unit {

    public explosionRadius: number = 3;
    public explosionDamage: number = 100;
    public slimeDuration: number = 10;
    public slimePuddle: SlimePuddle = { x: 0, y: 0, radius: 0, ttl: 0 };
    public hasExploded: boolean = false;

    constructor(options: UnitConstructorOptions) {
        super(options);
        this.hp = 50;
        this.maxHp = 50;
        this.speed = 4;
    }

    protected explode(): void {

        if(this.hasExploded) return;

        for (const enemy of this.enemies){

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < this.explosionRadius){
                enemy.takeDamage(this.explosionDamage, 'explosion');
            }
        }

        this.slimePuddle = { 
            x: this.x,
            y: this.y,
            radius: 3,
            ttl: this.slimeDuration
        };
        
        this.hasExploded = true;
        this.die();
    }

    protected onEnemyFound(enemy: Unit, distance: number): void {
        this.targetX = enemy.x;
        this.targetY = enemy.y;
        if (distance < this.explosionRadius) {
            this.explode();
        }
    }

    public takeDamage(amount: number, type: string): void {
        if (!this.isAlive) return;

        // При огненном уроне — немедленный взрыв
        if (type === 'fire') {
            this.explode();
            return;
        }

        super.takeDamage(amount, type);
    }

    protected onDeath(): void {
        if(!this.hasExploded){
            this.explode();
        }
    }
}

export default Champigneb;