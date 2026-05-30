import { Army } from "../../Army";
import Unit, { TUnitOptions } from "../Units";

class Champigneb extends Unit {

    private currentEnemiesPool: Unit[] = [];
    public explosionRadius: number = 6;
    public explosionDamage: number = 60;
    public hasExploded: boolean = false;

    constructor(options: TUnitOptions) {
        super(options);
        this.visibility = options.visibility ?? 4;
        this.hp = 35;
        this.baseHp = 35;
        this.speed = options.speed ?? 3;
        this.attackRange = options.attackRange ?? 6;
        // Champigneb стоит в формации "пояса мин" впереди sporomet и срывается
        // в kamikaze только на врагов в пределах 20 единиц от своего слота.
        // Иначе раньше любая видимая цель уводила его с поста.
        this.leashRadius = 20;
    }

    protected explode(): void {

        if(this.hasExploded) return;

        const targets = this.currentEnemiesPool.length > 0 ? this.currentEnemiesPool : this.enemies;
        
        for (const enemy of targets){
            if (!enemy.isAlive) continue;

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < this.explosionRadius){
                enemy.takeDamage(this.explosionDamage);
            }
        }

        this.hasExploded = true;
        this.hp = 0; // Клиент определяет смерть по hp === 0, поэтому обнуляем явно
        this.die();
    }

    protected onEnemyFound(enemy: Unit, distance: number): void {
        this.targetX = enemy.x;
        this.targetY = enemy.y;

        if (this.enemies) {
            this.currentEnemiesPool = this.enemies;
        }

        if (distance < 6) {
            this.explode();
        }
    }

    protected onDeath(): void {
        if(!this.hasExploded){
            this.explode();
        }
    }
}

export default Champigneb;