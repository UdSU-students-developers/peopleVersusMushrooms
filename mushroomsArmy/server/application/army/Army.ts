import Common from "../modules/common/Common";
import Champigneb, { TSlimePuddle } from "./entities/Champigneb";
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
        this.buildings = options.buildings;
        this.mapGuid = options.mapGuid;
        this.guid = options.guid;
        this.callbacks = options.callbacks;
        this.create(options.common);
        this.intervalId = setInterval(() => this.update(), 200);
    }

    private create(common: Common) {
        this.units.push(new Sporomet({ guid: common.guid(), type: 'sporomet', x: 0, y: 0, hp: 100, maxHp: 100, speed: 1, attackRange: 10 }));
        this.units.push(new Sporomet({ guid: common.guid(), type: 'sporomet', x: 10, y: 10, hp: 100, maxHp: 100, speed: 1, attackRange: 10 }));
        this.units.push(new Sporomet({ guid: common.guid(), type: 'sporomet', x: 20, y: 20, hp: 100, maxHp: 100, speed: 1, attackRange: 10 }));
        this.units.push(new Champigneb({ guid: common.guid(), type: 'champigneb', x: 5, y: 5, hp: 50, maxHp: 50, speed: 1, attackRange: 5 }));
        this.units.push(new Champigneb({ guid: common.guid(), type: 'champigneb', x: 15, y: 15, hp: 50, maxHp: 50, speed: 1, attackRange: 5 }));
        
        this.buildings.push(new Vzryvomor({ guid: common.guid(), x: 20, y: 22, hp: 50, maxHp: 50, attackRange: 5 }));
        this.buildings.push(new Vzryvomor({ guid: common.guid(), x: 40, y: 42, hp: 80, maxHp: 100, attackRange: 10 }));
        
        this.buildings.push(new SporovayaBashnya({ guid: common.guid(), type: 'sporovaya_bashnya', x: 20, y: 22, hp: 50, maxHp: 50 }));
        this.buildings.push(new SporovayaBashnya({ guid: common.guid(), type: 'sporovaya_bashnya', x: 40, y: 42, hp: 80, maxHp: 100 }));
        

        // Создаём прокси-юниты из зданий как изначальных целей для армии
        this.updateEnemyEntities(this.buildings.filter(building => building.type !== 'sporovaya_bashnya'));
    }

    /** Обновляет список целей армии из данных видимости (здания и юниты врага) */
    /** Синхронизирует урон по proxy-цели с локальным списком зданий врага */
    private syncBuildingDamage(guid: string, hp: number): void {
        const buildingIndex = this.buildings.findIndex(building => building.guid === guid);

        if (buildingIndex === -1) {return;}

        if (hp <= 0) {
            this.buildings.splice(buildingIndex, 1);
            return;
        }

        this.buildings[buildingIndex].hp = hp;
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

    private update(): void {
        const deltaTime = 0.2;

        for (const unit of this.units) {
            if (unit.isAlive) {
                unit.update(this.enemyUnits, this.map, deltaTime);
            } else if (unit.type === 'champigneb') {
                (unit as Champigneb).slimePuddle.ttl -= deltaTime;
            }
        }

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
            buildings: this.buildings.map(b => b.getState()),
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