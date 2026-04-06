import Common from "../modules/common/Common";
import Champigneb, { SlimePuddle } from "./entities/Champigneb";
import Sporomet from "./entities/Sporomet";
import Unit, { MapData, UnitState } from "./entities/Units";

export type TMap = (number | null)[][];

export interface ArmyOptions {
    mapGuid: string;
    map: TMap,
    buildings: any[],
    guid: string,
    common: Common,
    callbacks: { update: (guid: string, data: ArmyState) => void }
}

export interface ArmyState {
    map: TMap;
    units: UnitState[];
    slimePuddles: SlimePuddle[];
}

export class Army {
    public mapGuid: string;
    public guid: string;
    public map: TMap = [];
    public buildings: any;
    public units: Unit[] = [];
    public enemyUnits: Unit[] = [];
    public enemyBuildings: any[] = [];
    public callbacks: { update: (guid: string, data: ArmyState) => void };
    private intervalId: NodeJS.Timeout;

    constructor(options: ArmyOptions) {
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
        this.units.push(new Champigneb({ guid: common.guid(), type: 'champineb', x: 5, y: 5, hp: 50, maxHp: 50, speed: 1, attackRange: 5 }));
        this.units.push(new Champigneb({ guid: common.guid(), type: 'champineb', x: 15, y: 15, hp: 50, maxHp: 50, speed: 1, attackRange: 5 }));
    }

    private update(): void {
        const deltaTime = 0.2;

        for (const unit of this.units) {
            if (unit.isAlive) {
                unit.update(this.enemyUnits, this.map, deltaTime);
            } else if (unit.type === 'champineb') {
                (unit as Champigneb).slimePuddle.ttl -= deltaTime;
            }
        }

        this.units = this.units.filter(unit => {
            if (unit.type === 'champineb' && !unit.isAlive) {
                return (unit as Champigneb).slimePuddle.ttl > 0;
            }
            return true;
        });

        this.callbacks.update(this.guid!, this.getState());
    }

    public getState(): ArmyState {
        return {
            map: this.map,
            units: this.units.map(u => u.getState()),
            slimePuddles: this.units
                .filter(u => u.type === 'champineb' && !u.isAlive)
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