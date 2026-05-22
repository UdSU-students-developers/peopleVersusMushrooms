import Unit from "../Units";
import { TMap } from "../../Army";

export type TVzryvomorOptions = {
    guid: string;
    x: number;
    y: number;
    attackRange?: number;
};

type Point = {
    x: number;
    y: number;
};

const distance = (p1: Point, p2: Point) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

type Respawn = {
    respawnIn: number;
    inProgress: boolean;
};

type VzryvomorState = {
    guid: string;
    type: string;
    hp: number;
    x: number;
    y: number;
    attackRange: number;
    isAlive: boolean;
    isExploding: boolean;
    respawn: Respawn;
    elapsedFromLastDecision: number;
};

export interface IBuilding<T> {
    guid: string;
    type: string;
    x: number;
    y: number;
    hp: number;
    isAlive: boolean;
    update: (enemies: Unit[], map: TMap, deltaTime: number) => void;
    takeDamage: (amount: number) => void;
    getState: () => T;
}

export class Vzryvomor implements IBuilding<VzryvomorState> {

    public guid: string;
    public type: string = 'vzryvomor';
    public hp: number;
    public x: number ;
    public y: number;
    public attackRange: number;
    public attackDamage: number = 35;
    public isAlive: boolean;
    public respawn: Respawn = { inProgress: false, respawnIn: 0};
    private willRespawn: boolean = true;
    private elapsedFromLastDecision: number = 0;
    private DECISION_INTERVAL = 0.5; // seconds

    constructor({guid, x, y, attackRange}: TVzryvomorOptions) {
        this.guid = guid;
        this.x = x;
        this.y = y;
        this.hp = 70;
        this.attackRange = attackRange ?? 7;
        this.isAlive = true;
    };

    update(enemies: Unit[], map: TMap, deltaTime: number): void {
        // Во время респауна тикаем таймер даже если isAlive=false
        if (this.respawn.inProgress) {
            this.respawn.respawnIn -= deltaTime;
            this.elapsedFromLastDecision = 0;

            if (this.respawn.respawnIn <= 0) {
                this.respawn.inProgress = false;
                this.respawn.respawnIn = 0;
                if (this.willRespawn) {
                    this.isAlive = true;
                    this.hp = 70;
                }
            }
            return;
        }

        if (!this.isAlive) return;

        this.elapsedFromLastDecision += deltaTime;
        
        if (this.elapsedFromLastDecision >= this.DECISION_INTERVAL) {
            this.elapsedFromLastDecision = 0;
            this.makeDecision(enemies);
        }
    }

    private makeDecision(enemies: Unit[]): void {
        const nearbyEnemies = enemies.filter(e => e.isAlive && distance({ x: e.x, y: e.y }, { x: this.x, y: this.y }) < this.attackRange);

        if (nearbyEnemies.length === 0) return;

        let killedAny = false;
        for (const enemy of nearbyEnemies) {
            enemy.takeDamage(this.attackDamage);
            if (!enemy.isAlive) killedAny = true;
        }

        if (killedAny) {
            this.blow();
        } else {
            this.die();
        }
    }

    private blow() {
        this.willRespawn = true;
        this.isAlive = false;
        this.respawn = { inProgress: true, respawnIn: 5};
    }

    takeDamage(amount: number): void {
        if (!this.isAlive || this.respawn.inProgress) return;

        const finalAmount = Math.max(0, amount);
        this.hp -= finalAmount;
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    die(): void {
        this.willRespawn = false;
        this.isAlive = false;
        this.respawn = { inProgress: true, respawnIn: 1 };
    }
    
    getState(): VzryvomorState {
        return {
            guid: this.guid,
            type: this.type,
            x: this.x,
            y: this.y,
            hp: this.hp,
            elapsedFromLastDecision: this.elapsedFromLastDecision,
            attackRange: this.attackRange,
            isAlive: this.isAlive,
            isExploding: this.respawn.inProgress,
            respawn: this.respawn,
        };
    }
}