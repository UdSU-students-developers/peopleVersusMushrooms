import Unit from "./Units";
import { TMap } from "../Army";

export interface TVzryvomorOptions {
    guid: string;
    hp: number;
    maxHp: number;
    x: number;
    y: number;
    attackRange: number;
};

interface Point {
    x: number;
    y: number;
}

const distance = (p1: Point, p2: Point) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

interface Respawn {
    respawnIn: number;
    inProgress: boolean;
}

interface VzryvomorState {
    guid: string;
    type: string;
    hp: number;
    maxHp: number;
    x: number;
    y: number;
    attackRange: number;
    isAlive: boolean;
    isExploding: boolean;
    respawn: Respawn;
    elapsedFromLastDecision: number;
}

export interface IBuilding<T> {
    guid: string;
    type: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    isAlive: boolean;
    update: (enemies: Unit[], map: TMap, deltaTime: number) => void;
    takeDamage: (amount: number, type: string) => void;
    getState: () => T;
}

export class Vzryvomor implements IBuilding<VzryvomorState> {

    public guid: string;
    public type: string = 'vzryvomor';
    public hp: number;
    public maxHp: number;
    public x: number ;
    public y: number;
    public attackRange: number;
    public isAlive: boolean;
    public respawn: Respawn = { inProgress: false, respawnIn: 0};
    private elapsedFromLastDecision: number = 0;
    private DECISION_INTERVAL = 0.5; // seconds

    constructor({guid, x, y, hp, maxHp, attackRange}: TVzryvomorOptions) {
        this.guid = guid;
        this.x = x;
        this.y = y;
        this.hp = hp;
        this.maxHp = maxHp;
        this.attackRange = attackRange;
        this.isAlive = true;
    };

    update(enemies: Unit[], map: TMap, deltaTime: number): void {
        // Во время респауна тикаем таймер даже если isAlive=false
        if (this.respawn.inProgress) {
            this.respawn.respawnIn -= deltaTime;
            this.elapsedFromLastDecision = 0;

            if (this.respawn.respawnIn <= 0) {
                // Респаун завершён — восстанавливаем здание
                this.respawn.inProgress = false;
                this.respawn.respawnIn = 0;
                this.isAlive = true;
                this.hp = this.maxHp;
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

    private makeDecision(enemies: Unit []) {
        const TRIGGER_RADIUS = 6;
        const EXPLOSION_DAMAGE = 100;

        const isNearToMe = (e: Unit) => {
            const p: Point = { x: e.x, y: e.y};
            const myPos = {x: this.x, y: this.y};
            return distance (p, myPos) < TRIGGER_RADIUS;
        }
        const isAlive = (e: Unit) => e.isAlive
        const isNotAlive = (e: Unit) => !e.isAlive
        const makeDamage = (e: Unit) => {
            e.takeDamage(EXPLOSION_DAMAGE, 'explosion')
            return e
        }

        const enemiesNearToMe = 
            enemies
                .filter(isAlive)
                .filter(isNearToMe)

        const myFrags = 
            enemiesNearToMe
                .map(makeDamage)
                .filter(isNotAlive);
        
        if(enemiesNearToMe.length > 0) {
            if (myFrags.length > 0) {
                this.blow()
            }
            else {
                this.die()
            }
        }
    }

    private blow() {
        this.isAlive = false;
        this.respawn = { inProgress: true, respawnIn: 5};
    }

    takeDamage(amount: number, type: string): void {
        if (!this.isAlive || this.respawn.inProgress) return;

        const finalAmount = Math.max(0, amount);
        this.hp -= finalAmount;
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    die(): void {
        this.isAlive = false;
    }
    
    getState(): VzryvomorState {
    return {
        guid: this.guid,
        type: this.type,
        x: this.x,
        y: this.y,
        hp: this.hp,
        maxHp: this.maxHp,
        elapsedFromLastDecision: this.elapsedFromLastDecision,
        attackRange: this.attackRange,
        isAlive: this.isAlive,
        isExploding: this.respawn.inProgress,
        respawn: this.respawn
    };
}
}