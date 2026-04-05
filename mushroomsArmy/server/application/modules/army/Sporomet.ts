import Unit, { MapData, UnitConstructorOptions } from "./Units";

interface PoisonEffect {
    duration: number;
    damagePerSecond: number;
    sourceGuid: string;
}

class Sporomet extends Unit {
    public retreatRange: number = 4;
    public cooldown: number = 2;
    public aimTime: number = 0.5;
    public attackDamage: number = 5;
    public poisonDuration: number = 10;
    public poisonDamagePerSecond: number = 5;
    
    private lastShotTime: number = 0;
    private isAiming: boolean = false;
    private aimStartTime: number = 0;
    private currentTarget: Unit | null = null;

    constructor(options: UnitConstructorOptions) {
        super(options);
        this.hp = 30;
        this.maxHp = 30;
        this.speed = 2;
        this.attackRange = 8;
        this.lastShotTime = -this.cooldown;
    }

    private shoot(enemy: Unit): void {
        if (!this.isAlive || !enemy.isAlive) return;
        
        enemy.takeDamage(this.attackDamage, 'physical');
        
        this.applyPoisonEffect(enemy, {
            duration: this.poisonDuration,
            damagePerSecond: this.poisonDamagePerSecond,
            sourceGuid: this.guid
        });
    }

    private applyPoisonEffect(enemy: Unit, effect: PoisonEffect): void {
        let poisonEffects = (enemy as any).poisonEffects as PoisonEffect[] | undefined;
        
        if (!poisonEffects) {
            poisonEffects = [];
            (enemy as any).poisonEffects = poisonEffects;
        }
        
        const existingEffect = poisonEffects.find(e => e.sourceGuid === effect.sourceGuid);
        if (existingEffect) {
            existingEffect.duration = effect.duration;
        } else {
            poisonEffects.push({ ...effect });
        }
    }

    private updatePoisonEffects(enemies: Unit[], deltaTime: number): void {
        for (const enemy of enemies) {
            if (!enemy.isAlive) continue;
            
            let poisonEffects = (enemy as any).poisonEffects as PoisonEffect[] | undefined;
            if (!poisonEffects) continue;
            
            for (let i = poisonEffects.length - 1; i >= 0; i--) {
                const effect = poisonEffects[i];
                effect.duration -= deltaTime;
                
                const damage = effect.damagePerSecond * deltaTime;
                if (damage > 0) {
                    enemy.takeDamage(damage, 'poison');
                }
                
                if (effect.duration <= 0) {
                    poisonEffects.splice(i, 1);
                }
            }
        }
    }

    protected onEnemyFound(enemy: Unit, distance: number): void {
        const currentTime = Date.now() / 1000;
        
        if (distance < this.retreatRange) {
            this.isAiming = false;
            this.currentTarget = null;
            
            const dx = this.x - enemy.x;
            const dy = this.y - enemy.y;
            const norm = Math.sqrt(dx * dx + dy * dy);
            
            if (norm > 0.01) {
                this.targetX = this.x + (dx / norm) * 5;
                this.targetY = this.y + (dy / norm) * 5;
            }
        }
        else if (distance >= this.retreatRange && distance <= this.attackRange) {
            this.targetX = this.x;
            this.targetY = this.y;
            
            if (currentTime - this.lastShotTime >= this.cooldown) {
                if (!this.isAiming || this.currentTarget !== enemy) {
                    this.isAiming = true;
                    this.aimStartTime = currentTime;
                    this.currentTarget = enemy;
                }
            } else {
                this.isAiming = false;
                this.currentTarget = null;
            }
        }
        else if (distance > this.attackRange) {
            this.isAiming = false;
            this.currentTarget = null;
            this.targetX = enemy.x;
            this.targetY = enemy.y;
        }
    }

    public update(enemies: Unit[], mapData: MapData, deltaTime: number): void {
        if (!this.isAlive) return;
        
        this.updatePoisonEffects(enemies, deltaTime);
        
        super.update(enemies, mapData, deltaTime);
        
        if (this.isAiming && this.currentTarget && this.currentTarget.isAlive) {
            const currentTime = Date.now() / 1000;
            if (currentTime - this.aimStartTime >= this.aimTime) {
                this.isAiming = false;
                this.shoot(this.currentTarget);
                this.lastShotTime = currentTime;
                this.currentTarget = null;
            }
        } else if (this.isAiming) {
            this.isAiming = false;
            this.currentTarget = null;
        }
    }

    protected onDeath(): void {
    }
}

export default Sporomet;