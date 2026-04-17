import Common from "../modules/common/Common";
import Champigneb, { TSlimePuddle } from "./entities/Champigneb";
import Eblekar from "./entities/Eblekar";
import Sporomet from "./entities/Sporomet";
import SporovayaBashnya from "./entities/SporovayaBashnya";
import Unit, { TUnitState } from "./entities/Units";
import { IBuilding, Vzryvomor } from "./entities/Vzryvomor";

export type TMap = (number | null)[][];

export type TArmyOptions = {
    mapGuid: string;
    map: TMap;
    buildings: IBuilding<any>[];
    guid: string;
    common: Common;
    callbacks: { update: (guid: string, data: TArmyState) => void };
};

export type TArmyState = {
    map: TMap;
    units: TUnitState[];
    buildings: IBuilding<any>[];
    slimePuddles: TSlimePuddle[];
}

export class Army {
    public mapGuid: string;
    public guid: string;
    public map: TMap = [];
    public buildings: IBuilding<any>[] = [];
    public units: Unit[] = [];
    public enemyUnits: Unit[] = [];
    public enemyBuildings: IBuilding<any>[] = [];
    public callbacks: { update: (guid: string, data: TArmyState) => void };
    private intervalId: NodeJS.Timeout;

    constructor(options: TArmyOptions) {
        this.map = options.map;
        this.mapGuid = options.mapGuid;
        this.guid = options.guid;
        this.callbacks = options.callbacks;
        this.create(options.common, options.buildings);
        this.intervalId = setInterval(() => this.update(), 200);
    }

    private create(common: Common, initialBuildings: any[] = []) {
        this.units.push(new Sporomet({ guid: common.guid(), type: 'sporomet', x: 0, y: 0, hp: 30, maxHp: 30, speed: 2, attackRange: 16 }));
        this.units.push(new Sporomet({ guid: common.guid(), type: 'sporomet', x: 10, y: 10, hp: 30, maxHp: 30, speed: 2, attackRange: 16 }));
        this.units.push(new Sporomet({ guid: common.guid(), type: 'sporomet', x: 20, y: 20, hp: 30, maxHp: 30, speed: 2, attackRange: 16 }));
        this.units.push(new Champigneb({ guid: common.guid(), type: 'champigneb', x: 5, y: 5, hp: 50, maxHp: 50, speed: 4, attackRange: 6 }));
        this.units.push(new Champigneb({ guid: common.guid(), type: 'champigneb', x: 15, y: 15, hp: 50, maxHp: 50, speed: 4, attackRange: 6 }));
        this.units.push(new Eblekar({ guid: common.guid(), type: 'eblekar', x: 10, y: 0, hp: 40, maxHp: 40, speed: 2, attackRange: 0 }));
        
        // Создание своих зданий из initialBuildings
        for (const building of initialBuildings) {
            if (building.type === 'sporovaya_bashnya') {
                this.buildings.push(new SporovayaBashnya({
                    guid: building.guid,
                    type: building.type,
                    x: building.x,
                    y: building.y,
                    hp: building.hp,
                    maxHp: building.maxHp
                }));
            } else if (building.type === 'vzryvomor') {
                this.buildings.push(new Vzryvomor({
                    guid: building.guid,
                    x: building.x,
                    y: building.y,
                    hp: building.hp,
                    maxHp: building.maxHp,
                    attackRange: building.attackRange || 5
                }));
            }
        }
        
        console.log(`[Army] Создано ${this.buildings.length} зданий: ${this.buildings.map(b => b.type).join(', ')}`);

        // Вражеские здания (house, barracks, tower) — в прокси-цели для юнитов
        this.enemyBuildings = initialBuildings.filter(b => b.type !== 'sporovaya_bashnya' && b.type !== 'vzryvomor') as IBuilding<any>[];
        this.updateEnemyEntities(this.enemyBuildings);
    }

    /** Обновляет список целей армии из данных видимости (здания и юниты врага) */
    /** Синхронизирует урон по proxy-цели с локальным списком зданий врага */
    private syncBuildingDamage(guid: string, hp: number): void {
        const buildingIndex = this.enemyBuildings.findIndex(building => building.guid === guid);

        if (buildingIndex === -1) { return; }

        if (hp <= 0) {
            this.enemyBuildings.splice(buildingIndex, 1);
            return;
        }

        this.enemyBuildings[buildingIndex].hp = hp;
    }

    /** Создаёт proxy-юнита для здания и пробрасывает урон обратно в this.buildings. */
    private createEnemyProxy(entity: IBuilding<any>): Unit {
        const proxy = new Unit({
            guid: entity.guid,
            type: entity.type,
            x: entity.x,
            y: entity.y,
            hp: entity.hp,
            maxHp: entity.maxHp,
            speed: 0,
            attackRange: 0,
        });

        const baseTakeDamage = proxy.takeDamage.bind(proxy);

        proxy.takeDamage = (amount: number, type: string): void => {
            baseTakeDamage(amount, type);
            this.syncBuildingDamage(proxy.guid, proxy.hp);
        };

        return proxy;
    }

    /** Обновляет цели из видимости: существующим proxy меняет координаты, и создаёт новых по guid. */
    public updateEnemyEntities(entities: IBuilding<any>[]): void {
        const existingEnemiesByGuid = new Map(
            this.enemyUnits.map(enemy => [enemy.guid, enemy] as const)
        );

        this.enemyUnits = entities.map(entity => {
            const existingEnemy = existingEnemiesByGuid.get(entity.guid);

            if (existingEnemy) {
                existingEnemy.x = entity.x;
                existingEnemy.y = entity.y;
                return existingEnemy;
            }

            return this.createEnemyProxy(entity);
        });
        
    }

    /** Наносит урон вражеским юнитам, находящимся в лужах слизи (5 damage/sec) */
    private applySlimePuddleDamage(deltaTime: number): void {
        const SLIME_DAMAGE_PER_SECOND = 5;
        const activePuddles = this.units
            .filter(u => u.type === 'champigneb' && !u.isAlive && (u as Champigneb).slimePuddle.ttl > 0)
            .map(u => (u as Champigneb).slimePuddle);

        if (activePuddles.length === 0) return;

        for (const enemy of this.enemyUnits) {
            if (!enemy.isAlive) continue;
            for (const puddle of activePuddles) {
                const dx = enemy.x - puddle.x;
                const dy = enemy.y - puddle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= puddle.radius) {
                    enemy.takeDamage(SLIME_DAMAGE_PER_SECOND * deltaTime, 'poison');
                    break; // Не стакаем урон от нескольких луж за один тик
                }
            }
        }
    }

    private update(): void {
        const deltaTime = 0.2;

        const aliveAllies = this.units.filter(u => u.isAlive);

        for (const unit of this.units) {
            if (unit.isAlive) {
                if (unit.type === 'eblekar') {
                    (unit as Eblekar).update(this.enemyUnits, this.map, deltaTime, aliveAllies);
                } else {
                    unit.update(this.enemyUnits, this.map, deltaTime);
                }
            } else if (unit.type === 'champigneb') {
                (unit as Champigneb).slimePuddle.ttl -= deltaTime;
            }
        }

        // Урон от луж слизи по вражеским юнитам
        this.applySlimePuddleDamage(deltaTime);

        // Тикаем все здания — включая мёртвые взрывоморы, ожидающие respawn
        for (const building of this.buildings) {
            building.update(this.enemyUnits, this.map, deltaTime);
        }

        // Удаляем только те здания, что мертвы И не ждут respawn
        this.buildings = this.buildings.filter(b => {
            if (b.type === 'vzryvomor') {
                return b.isAlive || (b as Vzryvomor).respawn.inProgress;
            }
            return b.isAlive;
        });
        
        this.units = this.units.filter(unit => {
            if (unit.type === 'champigneb' && !unit.isAlive) {
                return (unit as Champigneb).slimePuddle.ttl > 0;
            }
            return true;
        });

        this.callbacks.update(this.guid!, this.getState());
    }

    public getState(): TArmyState {
        return {
            map: this.map,
            units: this.units.map(u => u.getState()),
            buildings: [
                ...this.buildings.map(b => b.getState()),
                ...this.enemyBuildings,
            ],
            slimePuddles: this.units
                .filter(u => u.type === 'champigneb' && !u.isAlive)
                .map(u => (u as Champigneb).slimePuddle)
        };
    }

    public getAliveUnits(): Unit[] {
        return this.units.filter(u => u.isAlive);
    }

    public destructor(): void {
        clearInterval(this.intervalId);
    }
}