import { TMap } from "../../Army";
import Unit, { TPoisonEffect, TUnitOptions, ProjectileType } from "../Units";

class Sporomet extends Unit {
    public retreatRange: number = 8;
    public cooldown: number = 2;
    public aimTime: number = 0.5;
    public attackDamage: number = 9;
    public poisonDuration: number = 10;
    public poisonDamagePerSecond: number = 10;

    private lastShotTime: number = 0;
    private isAiming: boolean = false;
    private aimStartTime: number = 0;
    private currentTarget: Unit | null = null;

    constructor(options: TUnitOptions) {
        super(options);
        this.visibility = options.visibility ?? 9;
        this.hp = 20;
        this.baseHp = 20;
        this.speed = options.speed ?? 2;
        this.attackRange = options.attackRange ?? 10;
        this.lastShotTime = -this.cooldown;
    }

    private shoot(enemy: Unit): void {
        if (!this.isAlive || !enemy.isAlive) return;

        this.projectiles.push({
            guid: `${this.guid}-${Date.now()}-${Math.random()}`,
            type: ProjectileType.SPOROMET,
            fromX: this.x,
            fromY: this.y,
            toX: enemy.x,
            toY: enemy.y,
            createdAt: Date.now(),
        });

        enemy.takeDamage(this.attackDamage);

        this.applyPoisonEffect(enemy, {
            duration: this.poisonDuration,
            damagePerSecond: this.poisonDamagePerSecond,
            sourceGuid: this.guid
        });
    }

    private applyPoisonEffect(enemy: Unit, effect: TPoisonEffect): void {
        const existingEffect = enemy.poisonEffects.find(e => e.sourceGuid === effect.sourceGuid);
        if (existingEffect) {
            existingEffect.duration = effect.duration;
        } else {
            enemy.poisonEffects.push({ ...effect });
        }
    }

    private updatePoisonEffects(enemies: Unit[], deltaTime: number): void {
        for (const enemy of enemies) {
            if (!enemy.isAlive) continue;

            for (let i = enemy.poisonEffects.length - 1; i >= 0; i--) {
                const effect = enemy.poisonEffects[i];
                effect.duration -= deltaTime;

                const damage = effect.damagePerSecond * deltaTime;
                if (damage > 0) {
                    enemy.takeDamage(damage);
                }

                if (effect.duration <= 0) {
                    enemy.poisonEffects.splice(i, 1);
                }
            }
        }
    }

    protected override onEnemyFound(enemy: Unit, distance: number): void {
        const currentTime = Date.now() / 1000;

        // Если текущая цель мертва — сбрасываем прицел
        if (this.currentTarget && !this.currentTarget.isAlive) {
            this.isAiming = false;
            this.currentTarget = null;
        }

        const isBuilding = enemy.speed === 0;

        if (distance < this.retreatRange && !isBuilding) {
            // Слишком близко к мобильному юниту — отступаем
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
        else if (distance <= this.attackRange) {
            // В зоне атаки — выбираем позицию
            if (isBuilding) {
                // Если это здание — стоим на месте
                this.targetX = this.x;
                this.targetY = this.y;
            } else {
                // Оптимальная дистанция для перестрелки с юнитами
                const optimalDistance = (this.retreatRange + this.attackRange) / 2;

                if (distance < optimalDistance - 0.5) {
                    const dx = this.x - enemy.x;
                    const dy = this.y - enemy.y;
                    const norm = Math.sqrt(dx * dx + dy * dy);
                    if (norm > 0.01) {
                        this.targetX = this.x + (dx / norm) * 1;
                        this.targetY = this.y + (dy / norm) * 1;
                    }
                } else {
                    this.targetX = this.x;
                    this.targetY = this.y;
                }
            }

            // Логика прицеливания (теперь работает и для зданий, и для юнитов)
            if (currentTime - this.lastShotTime >= this.cooldown) {
                if (!this.isAiming || this.currentTarget !== enemy) {
                    this.isAiming = true;
                    this.aimStartTime = currentTime;
                    this.currentTarget = enemy;
                }
            }
        }
        else {
            // Далеко — приближаемся
            this.isAiming = false;
            this.currentTarget = null;
            this.targetX = enemy.x;
            this.targetY = enemy.y;
        }
    }

    public update(enemies: Unit[], map: TMap, deltaTime: number): void {
        if (!this.isAlive) return;

        this.updatePoisonEffects(enemies, deltaTime);

        super.update(enemies, map, deltaTime);

        if (this.isAiming && this.currentTarget) {
            // Цель умерла — сброс
            if (!this.currentTarget.isAlive) {
                this.isAiming = false;
                this.currentTarget = null;
                return;
            }

            // Проверяем, что цель всё ещё в зоне атаки
            const dx = this.currentTarget.x - this.x;
            const dy = this.currentTarget.y - this.y;
            const distToTarget = Math.sqrt(dx * dx + dy * dy);

            if (distToTarget > this.attackRange) {
                // Цель вышла за радиус — сброс прицела
                this.isAiming = false;
                this.currentTarget = null;
                return;
            }

            const currentTime = Date.now() / 1000;
            if (currentTime - this.aimStartTime >= this.aimTime) {
                this.isAiming = false;
                this.shoot(this.currentTarget);
                this.lastShotTime = currentTime;
                this.currentTarget = null;
            }
        }
    }

    protected onDeath(): void {
    }
}

export default Sporomet;
