import EasyStar = require('easystarjs');
import { TMap } from '../Army';

// Тайл-ID для непроходимых клеток (null в исходной карте → этот номер в EasyStar)
const BLOCKED_TILE = 3;
// Грибы проходимы по равнинам (0) и горам (2)
const ACCEPTABLE_TILES = [0, 2];

export type TUnitOptions = {
    guid: string;
    type: string;
    hp?: number;
    maxHp?: number;
    speed?: number;
    x: number;
    y: number;
    attackRange?: number;
    fireDamageMultiplier?: number;
    projectiles?: TProjectile[];
};

export type TUnitState = {
  guid: string;
  type: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  isHealing?: boolean;
};

export type TPoisonEffect = {
    duration: number;
    damagePerSecond: number;
    sourceGuid: string;
};

export type TProjectile = {
    guid: string;
    type: 'sporomet' | 'sporovaya_bashnya' | 'eblekar';
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    createdAt: number;
};

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
    public poisonEffects: TPoisonEffect[] = [];
    public projectiles: TProjectile[] = [];
    protected enemies: Unit [] = [];
    
    private easyStar: EasyStar.js;
    protected path: Array<{x: number, y: number}> = [];
    private lastTargetTileX: number;
    private lastTargetTileY: number;

    private decisionAccumulator: number = 0;
    private readonly DECISION_INTERVAL: number = 0.5; 

    constructor({guid, type, x, y, hp, maxHp, speed, attackRange, fireDamageMultiplier = 2, projectiles = []}: TUnitOptions) {
        this.guid = guid;
        this.type = type;
        this.x = x;
        this.y = y;
        this.hp = hp;
        this.maxHp = maxHp;
        this.speed = speed;
        this.attackRange = attackRange;
        this.fireDamageMultiplier = fireDamageMultiplier;
        this.projectiles = projectiles;
        this.targetX = x;
        this.targetY = y;
        this.isAlive = true;

        this.easyStar = new EasyStar.js();
        this.easyStar.setAcceptableTiles(ACCEPTABLE_TILES);
        this.easyStar.enableSync();
        this.lastTargetTileX = Math.floor(x);
        this.lastTargetTileY = Math.floor(y);
    }


    update(enemies: Unit[], map: TMap, deltaTime: number, allies: Unit[] = []): void {
        if (!this.isAlive) return;

        this.enemies = enemies;
        
        this.decisionAccumulator += deltaTime;
        
        if (this.decisionAccumulator >= this.DECISION_INTERVAL) {
            this.decisionAccumulator = 0;
            this.makeDecision(enemies, map);
        }
        
        this.moveTo(this.targetX, this.targetY, map, deltaTime);
    }
    
    private makeDecision(enemies: Unit[], map: TMap): void {
        let nearestEnemy: Unit | null = null;
        let nearestDistance: number = Infinity;
        
        for (const enemy of enemies) {
            if (!enemy.isAlive) continue;
            
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < nearestDistance && this.hasLineOfSight(this.x, this.y, enemy.x, enemy.y, map)) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        }
        
        // Нет видимого врага — ищем ближайшего без LoS (просто идём к нему через pathfinding)
        if (!nearestEnemy) {
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
        }

        if (nearestEnemy) {
            this.onEnemyFound(nearestEnemy, nearestDistance);
        } else {
            // Нет врагов — двигаемся к центру карты
            this.targetX = 50;
            this.targetY = 50;
        }
    }

    /** Проверяет прямую видимость между двумя точками (Bresenham) */
    protected hasLineOfSight(
        fromX: number, fromY: number,
        toX: number, toY: number,
        map: TMap
    ): boolean {
        const x0 = Math.floor(fromX);
        const y0 = Math.floor(fromY);
        const x1 = Math.floor(toX);
        const y1 = Math.floor(toY);

        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = x0 < x1 ? 1 : -1;
        let sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        let cx = x0;
        let cy = y0;

        while (true) {
            // Проверяем, что клетка в пределах карты и проходима
            if (cx >= 0 && cy >= 0 && cy < map.length && cx < (map[0]?.length ?? 0)) {
                const tile = map[cy][cx];
                if (tile === null || tile === 1) {
                    // Стена или вода блокируют обзор
                    return false;
                }
            }

            if (cx === x1 && cy === y1) break;

            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; cx += sx; }
            if (e2 < dx) { err += dx; cy += sy; }
        }

        return true;
    }

    protected moveTo(targetX: number, targetY: number, map: TMap, deltaTime: number): void {
        if (!this.isAlive) return;

        this.calculateUnitPath(map);

        if (this.path.length === 0) return;

        // Двигаемся к центру следующей клетки пути
        const next = this.path[0];
        const dx = (next.x + 0.5) - this.x;
        const dy = (next.y + 0.5) - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.1) {
            this.path.shift();
            return;
        }

        const step = this.speed * deltaTime;
        const move = Math.min(step, distance);
        this.x += (dx / distance) * move;
        this.y += (dy / distance) * move;
    }

    /** Строит числовую сетку для EasyStar: null → BLOCKED_TILE */
    private buildGrid(map: TMap): number[][] {
        return map.map(row => row.map(tile => tile === null ? BLOCKED_TILE : tile));
    }

    /**
     * Ищет путь от текущей позиции до цели через EasyStar.
     * Возвращает массив клеток или null если путь не найден.
     */
    private findPath(map: TMap): Array<{x: number, y: number}> | null {
        const grid = this.buildGrid(map);
        this.easyStar.setGrid(grid);

        const height = grid.length;
        const width = grid[0]?.length ?? 0;

        const startX = Math.floor(this.x);
        const startY = Math.floor(this.y);
        const endX = Math.max(0, Math.min(width - 1, Math.round(this.targetX)));
        const endY = Math.max(0, Math.min(height - 1, Math.round(this.targetY)));

        if (startX < 0 || startX >= width || startY < 0 || startY >= height) return null;

        let result: Array<{x: number, y: number}> | null = null;
        let calculated = false;

        try {
            this.easyStar.findPath(startX, startY, endX, endY, (path) => {
                result = path;
                calculated = true;
            });
        } catch {
            return null;
        }

        if (!calculated) {
            const limit = height * width * 4;
            for (let i = 0; i < limit && !calculated; i++) {
                this.easyStar.calculate();
            }
        }

        return calculated ? result : null;
    }

    /** Пересчитывает путь если цель изменилась или путь пустой */
    private calculateUnitPath(map: TMap): void {
        const endX = Math.max(0, Math.min((map[0]?.length ?? 100) - 1, Math.round(this.targetX)));
        const endY = Math.max(0, Math.min((map.length ?? 100) - 1, Math.round(this.targetY)));

        const targetChanged = endX !== this.lastTargetTileX || endY !== this.lastTargetTileY;

        if (!targetChanged && this.path.length > 0) return;

        this.lastTargetTileX = endX;
        this.lastTargetTileY = endY;
        this.path = [];

        const p = this.findPath(map);
        if (p === null || p.length < 2) return;
        // Срезаем первую точку — это текущая позиция юнита
        this.path = p.slice(1);
    }

    takeDamage(amount: number, type: string): void {
        if (!this.isAlive) return;

        const sanitizedAmount = Math.max(0, amount);

        // Огонь снимает яд с отравленного юнита
        if (type === 'fire') {
            this.poisonEffects = [];
        }

        const finalAmount = type === 'fire' ? sanitizedAmount * this.fireDamageMultiplier : sanitizedAmount;

        this.hp -= finalAmount;
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    die(): void {
        this.isAlive = false;
        this.onDeath();
    }
    
    getState(): TUnitState {
        return {
            guid: this.guid,
            type: this.type,
            x: Math.floor(this.x),
            y: Math.floor(this.y),
            hp: this.hp,
            maxHp: this.maxHp,
        };
    }

    protected onDeath(): void {}
    protected onEnemyFound(enemy: Unit, distance: number): void {}
}

export default Unit;
