import Common from "../modules/common/Common";
import Champigneb, { TSlimePuddle } from "./entities/Champigneb/Champigneb";
import Eblekar from "./entities/Eblekar/Eblekar";
import Sporomet from "./entities/Sporomet/Sporomet";
import SporovayaBashnya from "./entities/SporovayaBashnya/SporovayaBashnya";
import Unit, { TProjectile, TUnitState } from "./entities/Units";
import { IBuilding, Vzryvomor } from "./entities/Vzryvomor/Vzryvomor";

export type TMap = (number | null)[][];

export type TBuildingInput = {
    guid: string;
    type: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    attackRange?: number;
    sizeX?: number;
    sizeY?: number;
};

export type TBuildingState = {
    guid: string;
    type: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    isAlive?: boolean;
    isExploding?: boolean;
    isAttacking?: boolean;
    sizeX?: number;
    sizeY?: number;
    attackRange?: number;
    attackDamage?: number;
    respawn?: { inProgress: boolean; respawnIn: number };
    elapsedFromLastDecision?: number;
};

export type TArmyOptions = {
    mapGuid: string;
    map: TMap;
    buildings: TBuildingInput[];
    guid: string;
    common: Common;
    callbacks: { update: (guid: string, data: TArmyState) => void };
};

export type TArmyState = {
    map: TMap;
    units: TUnitState[];
    buildings: TBuildingState[];
    slimePuddles: TSlimePuddle[];
    projectiles: TProjectile[];
}

export class Army {
    public mapGuid: string;
    public guid: string;
    public map: TMap = [];
    public buildings: IBuilding<TBuildingState>[] = [];
    public units: Unit[] = [];
    public enemyUnits: Unit[] = [];
    public enemyBuildings: TBuildingInput[] = [];
    public projectiles: TProjectile[] = [];
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

    private create(common: Common, initialBuildings: TBuildingInput[] = []) {
        this.units.push(new Sporomet({ guid: common.guid(), type: 'sporomet', x: 0, y: 0, hp: 8, maxHp: 8, speed: 1, attackRange: 12, projectiles: this.projectiles }));
        this.units.push(new Sporomet({ guid: common.guid(), type: 'sporomet', x: 10, y: 10, hp: 8, maxHp: 8, speed: 1, attackRange: 12, projectiles: this.projectiles }));
        this.units.push(new Sporomet({ guid: common.guid(), type: 'sporomet', x: 20, y: 20, hp: 8, maxHp: 8, speed: 1, attackRange: 12, projectiles: this.projectiles }));
        this.units.push(new Champigneb({ guid: common.guid(), type: 'champigneb', x: 5, y: 5, hp: 35, maxHp: 35, speed: 3, attackRange: 6 }));
        this.units.push(new Champigneb({ guid: common.guid(), type: 'champigneb', x: 45, y: 50, hp: 35, maxHp: 35, speed: 3, attackRange: 6 }));
        this.units.push(new Eblekar({ guid: common.guid(), type: 'eblekar', x: 15, y: 20, hp: 40, maxHp: 40, speed: 1, attackRange: 1, projectiles: this.projectiles }));
        // Создание своих зданий из initialBuildings
        for (const building of initialBuildings) {
            if (building.type === 'sporovaya_bashnya') {
                this.buildings.push(new SporovayaBashnya({
                    guid: building.guid,
                    x: building.x,
                    y: building.y,
                    hp: building.hp,
                    maxHp: building.maxHp,
                    projectiles: this.projectiles,
                }));
            } else if (building.type === 'vzryvomor') {
                this.buildings.push(new Vzryvomor({
                    guid: building.guid,
                    x: building.x,
                    y: building.y,
                    hp: building.hp,
                    maxHp: building.maxHp,
                    attackRange: building.attackRange || 7
                }));
            }
        }

        // Вражеские здания (house, barracks, tower) — в прокси-цели для юнитов
        this.enemyBuildings = initialBuildings.filter(b => b.type !== 'sporovaya_bashnya' && b.type !== 'vzryvomor');
        this.updateEnemyEntities(this.enemyBuildings);
    }

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
    private createEnemyProxy(entity: TBuildingInput): Unit {
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

     static generateDefensiveLayout(map: TMap, common: Common): TBuildingInput[] {
        const mapRows = map.length;
        const mapCols = map[0]?.length ?? 0;
        if (mapRows === 0 || mapCols === 0) return [];
        const startX = mapCols - 1;
        const startY = mapRows - 1;
        const RADIUS = 20;
        const result: TBuildingInput[] = [];
    
        const isFree = (y: number, x: number): boolean =>
            y >= 0 && y < mapRows &&
            x >= 0 && x < mapCols &&
            map[y][x] === 0;
    
        const isInRadius = (y: number, x: number): boolean => {
            const dx = x - startX;
            const dy = y - startY;
            return Math.sqrt(dx * dx + dy * dy) <= RADIUS;
        };
    
        const freeCells: { y: number; x: number }[] = [];
        for (let y = 0; y < mapRows; y++) {
            for (let x = 0; x < mapCols; x++) {
                if (isFree(y, x) && isInRadius(y, x)) {
                    freeCells.push({ y, x });
                }
            }
        }
    
        if (freeCells.length === 0) return [];
    
        freeCells.sort((a, b) => {
            const distA = Math.hypot(a.x - startX, a.y - startY);
            const distB = Math.hypot(b.x - startX, b.y - startY);
            return distA - distB;
        });
    
        const minX = Math.min(...freeCells.map(cell => cell.x));

        //Расставляем взрывоморов
        const wallX = minX;
        const wallCells = freeCells.filter(cell => cell.x >= wallX && cell.x < wallX + 3).sort((a, b) => a.x - b.x || a.y - b.y);
        const vzryvomorCount = Math.min(5, Math.max(3, wallCells.length));
        const vzryvomorCells = wallCells.slice(0, vzryvomorCount);
    
        for (const cell of vzryvomorCells) {
            result.push({
                guid: common.guid(),
                type: 'vzryvomor',
                x: cell.x,
                y: cell.y,
                hp: 8,
                maxHp: 8,
                attackRange: 12,
            });
        }
    
        const usedCells = new Set(vzryvomorCells.map(c => `${c.y},${c.x}`));
        
        //Расставляем Споровые башни
        const find2x2SpotBehindWall = (): { y: number; x: number } | null => {
            const cellsBehindWall = [...freeCells].filter(cell => 
                    !usedCells.has(`${cell.y},${cell.x}`) && 
                    cell.x > wallX 
                ).sort((a, b) => a.x - b.x); 
            
            for (const cell of cellsBehindWall) {
                const positions = [
                    { y: cell.y, x: cell.x },
                    { y: cell.y + 1, x: cell.x },
                    { y: cell.y, x: cell.x + 1 },
                    { y: cell.y + 1, x: cell.x + 1 },
                ];
                
                const allValid = positions.every(pos => 
                    pos.y >= 0 && pos.y < mapRows &&
                    pos.x >= 0 && pos.x < mapCols &&
                    map[pos.y][pos.x] === 0 &&
                    isInRadius(pos.y, pos.x) &&
                    !usedCells.has(`${pos.y},${pos.x}`) &&
                    pos.x > wallX 
                );
                
                if (allValid) {
                    for (const pos of positions) {
                        usedCells.add(`${pos.y},${pos.x}`);
                    }
                    return { y: cell.y, x: cell.x };
                }
            }
            return null;
        };
    
        const bashnyaCount = Math.min(2, Math.floor(freeCells.length / 4));
        for (let i = 0; i < bashnyaCount; i++) {
            const spot = find2x2SpotBehindWall();
            if (spot) {
                result.push({
                    guid: common.guid(),
                    type: 'sporovaya_bashnya',
                    x: spot.x,
                    y: spot.y,
                    hp: 8,
                    maxHp: 8,
                });
            } else {
                break;
            }
        }
    
        return result;
    }

    /** Обновляет цели из видимости: существующим proxy меняет координаты, и создаёт новых по guid. */
    public updateEnemyEntities(entities: TBuildingInput[]): void {
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
        this.projectiles.length = 0;

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
                return b.isAlive || (b as unknown as Vzryvomor).respawn.inProgress;
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
                .map(u => (u as Champigneb).slimePuddle),
            projectiles: this.projectiles,
        };
    }

    public getAliveUnits(): Unit[] {
        return this.units.filter(u => u.isAlive);
    }

    private isOutsideMap(y: number, x: number) {
        // Проверяем границы карты
        return y < 0 || y >= this.map.length || x < 0 || x >= (this.map[0]?.length ?? 0);
    }

    private isInsideMap(y: number, x: number){
        return !this.isOutsideMap(y, x);
    }

    public spawnUnit(type: 'sporomet' | 'champigneb' | 'eblekar', x: number, y: number, common: Common): { guid: string } | null {
        // Проверяем границы карты
        if (y < 0 || y >= this.map.length || x < 0 || x >= (this.map[0]?.length ?? 0)) {
            return null;
        }

        // Тайл должен быть 0 (равнина) или 2 (горы) — не вода (1) и не null (туман)
        const tile = this.map[y][x];
        if (tile !== 0 && tile !== 2) {
            return null;
        }

        const guid = common.guid();

        if (type === 'sporomet') {
            this.units.push(new Sporomet({ guid, type, x, y, hp: 8, maxHp: 8, speed: 1, attackRange: 12, projectiles: this.projectiles }));
        } else if (type === 'champigneb') {
            this.units.push(new Champigneb({ guid, type, x, y, hp: 35, maxHp: 35, speed: 3, attackRange: 6 }));
        } else if (type === 'eblekar') {
            this.units.push(new Eblekar({ guid, type, x, y, hp: 40, maxHp: 40, speed: 1, attackRange: 1, projectiles: this.projectiles }));
        }

        return { guid };
    }

    public spawnBuilding(type: 'vzryvomor' | 'sporovaya_bashnya', x: number, y: number, common: Common){
        const isValid = (y1: number, x1: number) => {
            // Тайл должен быть 0 (только равнина — не вода, не горы, не туман)
            return this.map[y1][x1] === 0;
        }

        let coords = null; 
        if (type === 'sporovaya_bashnya'){
            coords = [[y,x], [y + 1, x], [y, x + 1], [y+1, x + 1]];
        }
        else if (type === 'vzryvomor'){
            coords = [[y,x]];
        }
        
        let isOk = 
            coords?.every(c => {
                const [y, x] = c;
                return isValid(y, x) && this.isInsideMap(y, x)
            })
        
        if (isOk) {
            let guid = common.guid();
            if (type === 'vzryvomor') {
                this.buildings.push(new Vzryvomor({ guid: guid, x: x, y: y, hp: 8, maxHp: 8, attackRange: 12 }));
            }
            else if (type === 'sporovaya_bashnya') {
                this.buildings.push(new SporovayaBashnya({ guid: guid, x: x, y: y, hp: 8, maxHp: 8, projectiles: this.projectiles }));
            }
            else {
                return null;
            }
            return { guid: guid };
        }
        else {
            return null;
        }
    }

    public destructor(): void {
        clearInterval(this.intervalId);
    }
}
