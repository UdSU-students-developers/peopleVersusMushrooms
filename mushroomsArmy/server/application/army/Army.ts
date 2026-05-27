import Common from "../modules/common/Common";
import Champigneb from "./entities/Champigneb/Champigneb";
import Eblekar from "./entities/Eblekar/Eblekar";
import Pizdoglyad from "./entities/Pizdoglyad/Pizdoglyad";
import Sporomet from "./entities/Sporomet/Sporomet";
import SporovayaBashnya from "./entities/SporovayaBashnya/SporovayaBashnya";
import Unit, { TProjectile, TUnitState } from "./entities/Units";
import { IBuilding, Vzryvomor } from "./entities/Vzryvomor/Vzryvomor";
import type { TFormationState } from './ArmyStateManager';


export type TMap = (number | null)[][];

export type TBuildingInput = {
    guid: string;
    type: string;
    x: number;
    y: number;
    hp?: number;
    level?: number;
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
    visibility?: number;
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
    callbacks: {
        update: (guid: string, data: TArmyState) => void;
        takeDamage?: (unitGuid: string, amount: number) => void;
    };
};

export type TArmyState = {
    map: TMap;
    units: TUnitState[];
    enemyUnits: TUnitState[];
    buildings: TBuildingState[];
    economyUnits: TBuildingInput[];
    projectiles: TProjectile[];
    formation: TFormationState | null;
}

export type TMapBuildingEntity = {
    guid: string;
    x: number;
    y: number;
    type: string;
    visibility: number;
    size: number;
};

export class Army {
    public mapGuid: string;
    public guid: string;
    public map: TMap = [];
    public buildings: IBuilding<TBuildingState>[] = [];
    public units: Unit[] = [];
    public enemyUnits: Unit[] = [];
    public enemyBuildings: TBuildingInput[] = [];
    public economyBuildings: TBuildingInput[] = [];
    public economyUnits: TBuildingInput[] = [];
    // public sentBuildingGuids: Set<string> = new Set();
    /** Последнее состояние юнитов, отданное карте (протокол UPDATE_UNITS). */
    public projectiles: TProjectile[] = [];
    private mapSyncedUnits = new Map<string, { x: number; y: number; type: string; visibility: number }>();
    public mapSyncedBuildings = new Map<string, { guid: string; x: number; y: number; type: string; visibility: number; size: number }>();
    public callbacks: {
        update: (guid: string, data: TArmyState) => void;
        takeDamage?: (unitGuid: string, amount: number) => void;
    };
    private intervalId: NodeJS.Timeout;

    constructor(options: TArmyOptions) {
        this.map = options.map;
        this.mapGuid = options.mapGuid;
        this.guid = options.guid;
        this.callbacks = options.callbacks;
        this.create(options.common, options.buildings);
        this.intervalId = setInterval(() => this.update(), 200);
    }

    public destructor(): void {
        clearInterval(this.intervalId);
    }

    /**
     * Дельта для map UPDATE_UNITS: движение/спавн/смерть (см. map/API.md §4.2.4).
     */
    public buildMapUnitUpdateEntities(): Array<{ guid: string; x: number; y: number; type: string; visibility: number }> {
        const entities: Array<{ guid: string; x: number; y: number; type: string; visibility: number }> = [];
        const aliveGuids = new Set<string>();

        for (const unit of this.units) {
            const s = unit.getState();
            aliveGuids.add(s.guid);
            const snapshot = {
                guid: s.guid,
                x: s.x,
                y: s.y,
                type: s.type,
                visibility: s.visibility ?? 1,
            };
            const prev = this.mapSyncedUnits.get(s.guid);
            if (!prev || prev.x !== snapshot.x || prev.y !== snapshot.y) {
                entities.push(snapshot);
            }
        }

        for (const [guid, prev] of this.mapSyncedUnits) {
            if (!aliveGuids.has(guid)) {
                entities.push({
                    guid,
                    x: prev.x,
                    y: prev.y,
                    type: prev.type,
                    visibility: prev.visibility,
                });
            }
        }

        for (const entity of entities) {
            if (aliveGuids.has(entity.guid)) {
                this.mapSyncedUnits.set(entity.guid, {
                    x: entity.x,
                    y: entity.y,
                    type: entity.type,
                    visibility: entity.visibility,
                });
            } else {
                this.mapSyncedUnits.delete(entity.guid);
            }
        }

        return entities;
    }

    /**
     * Преобразует внутренний стейт здания в сущность для синхронизации с картой.
     */
    private buildingStateToMapEntity(state: TBuildingState): TMapBuildingEntity {
        const sizeX = state.sizeX ?? 1;
        const sizeY = state.sizeY ?? 1;
        
        return {
            guid: state.guid,
            x: state.x,
            y: state.y,
            type: state.type,
            visibility: state.visibility ?? 1,
            size: Math.max(sizeX, sizeY, 1),
        };
    }

    /**
     * Дельта для map UPDATE_BUILDINGS (см. map/API.md §4.2.5):
     * — Новое здание или изменившееся старое → отправляем snapshot
     * — Здание уничтожено (было в кэше, но пропало из армии) → отправляем старый snapshot (tombstone)
     */
    public buildMapBuildingUpdateEntities(): TMapBuildingEntity[] {
        const entities: TMapBuildingEntity[] = [];
        const aliveGuids = new Set<string>();

        // 1. Проверяем текущие живые здания армии
        for (const building of this.buildings) {
            const snapshot = this.buildingStateToMapEntity(building.getState());
            aliveGuids.add(snapshot.guid);

            const prev = this.mapSyncedBuildings.get(snapshot.guid);
            
            // Отправляем, если здания вообще не было на карте, ИЛИ если у него изменились важные данные
            if (!prev || prev.x !== snapshot.x || prev.y !== snapshot.y || prev.visibility !== snapshot.visibility) {
                entities.push(snapshot);
                this.mapSyncedBuildings.set(snapshot.guid, snapshot); // Сразу пишем в кэш
            }
        }

        // 2. Ищем здания, которые были снесены (были на карте, но их больше нет в стейте)
        for (const [guid, prevSnapshot] of this.mapSyncedBuildings) {
            if (!aliveGuids.has(guid)) {
                entities.push(prevSnapshot);          // Отправляем tombstone (повтор координат удаляет объект)
                this.mapSyncedBuildings.delete(guid); // Сразу чистим кэш
            }
        }

        return entities;
    }

    private create(common: Common, initialBuildings: TBuildingInput[] = []) {
        // Создание своих зданий из initialBuildings
        for (const building of initialBuildings) {
            if (building.type === 'sporovaya_bashnya') {
                this.buildings.push(new SporovayaBashnya({
                    guid: building.guid,
                    x: building.x,
                    y: building.y,
                    projectiles: this.projectiles,
                }));
            } else if (building.type === 'vzryvomor') {
                this.buildings.push(new Vzryvomor({
                    guid: building.guid,
                    x: building.x,
                    y: building.y,
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
            hp: entity.hp ?? 1,
            speed: 0,
            attackRange: 0,
        });

        const baseTakeDamage = proxy.takeDamage.bind(proxy);

        proxy.takeDamage = (amount: number): void => {
            baseTakeDamage(amount);
            this.syncBuildingDamage(proxy.guid, proxy.hp);
            this.callbacks.takeDamage?.(proxy.guid, amount);
        };

        return proxy;
    }

     static generateDefensiveLayout(map: TMap, common: Common): TBuildingInput[] {
        const mapRows = map.length;
        const mapCols = map[0]?.length ?? 0;
        if (mapRows === 0 || mapCols === 0) return [];

        const result: TBuildingInput[] = [];

        const isFree = (y: number, x: number): boolean =>
            y >= 0 && y < mapRows &&
            x >= 0 && x < mapCols &&
            map[y][x] === 0;

        // Стартовая зона грибов — нижний правый 15×15 угол (гарантированно зелёный)
        const zoneX0 = mapCols - 15; // левая граница зоны (включительно)
        const zoneY0 = mapRows - 15; // верхняя граница зоны (включительно)
        const zoneX1 = mapCols - 1;  // правая граница (включительно)
        const zoneY1 = mapRows - 1;  // нижняя граница зоны (включительно)

        // Вспомогательная функция: разместить башню 2×2 с левым верхним тайлом (topY, leftX)
        const tryPlaceTower = (topY: number, leftX: number): void => {
            for (let dy = 0; dy <= 1; dy++) {
                for (let dx = 0; dx <= 1; dx++) {
                    if (!isFree(topY + dy, leftX + dx)) return;
                }
            }
            result.push({
                guid: common.guid(),
                type: 'sporovaya_bashnya',
                x: leftX,
                y: topY,
            });
        };

        // Три башни: угловая (пересечение стен), правая верхняя, левая нижняя
        tryPlaceTower(zoneY0 + 1, zoneX0 + 1); // угол стен
        tryPlaceTower(zoneY0 + 1, zoneX1 - 1); // правый верхний
        tryPlaceTower(zoneY1 - 1, zoneX0 + 1); // левый нижний

        // Левая стена: x=zoneX0, вся высота зоны
        for (let y = zoneY0; y <= zoneY1; y++) {
            if (isFree(y, zoneX0)) {
                result.push({
                    guid: common.guid(),
                    type: 'vzryvomor',
                    x: zoneX0,
                    y,
                });
            }
        }

        // Верхняя стена: y=zoneY0, вся ширина зоны кроме x=zoneX0 (уже занят левой стеной)
        for (let x = zoneX0 + 1; x <= zoneX1; x++) {
            if (isFree(zoneY0, x)) {
                result.push({
                    guid: common.guid(),
                    type: 'vzryvomor',
                    x,
                    y: zoneY0,
                });
            }
        }

        // ── Споровые башни вдоль линий обороны, каждые 10 клеток ──────────────
        // Могут ставиться на равнине (0) и горах (2).
        // Строятся за стеной (со стороны базы), чтобы стена их прикрывала.

        // Множество уже занятых тайлов для предотвращения наложений
        const occupied = new Set<string>();
        for (const b of result) {
            const sx = b.type === 'sporovaya_bashnya' ? 2 : 1;
            const sy = b.type === 'sporovaya_bashnya' ? 2 : 1;
            for (let dy = 0; dy < sy; dy++)
                for (let dx = 0; dx < sx; dx++)
                    occupied.add(`${b.x + dx},${b.y + dy}`);
        }

        // Проверка блока 2×2: равнина или гора, не занято
        const isFreeForTower = (topY: number, leftX: number): boolean => {
            for (let dy = 0; dy <= 1; dy++) {
                for (let dx = 0; dx <= 1; dx++) {
                    const ty = topY + dy, tx = leftX + dx;
                    if (ty < 0 || ty >= mapRows || tx < 0 || tx >= mapCols) return false;
                    const tile = map[ty][tx];
                    if (tile !== 0 && tile !== 2) return false;
                    if (occupied.has(`${tx},${ty}`)) return false;
                }
            }
            return true;
        };

        const addTower = (topY: number, leftX: number): void => {
            if (!isFreeForTower(topY, leftX)) return;
            const b: TBuildingInput = { guid: common.guid(), type: 'sporovaya_bashnya', x: leftX, y: topY };
            result.push(b);
            for (let dy = 0; dy <= 1; dy++)
                for (let dx = 0; dx <= 1; dx++)
                    occupied.add(`${leftX + dx},${topY + dy}`);
        };

        // За левой стеной (x=zoneX0) — башня сдвинута вправо на 1, каждые 7 клеток по Y
        for (let y = zoneY0; y <= zoneY1 - 1; y += 7) {
            addTower(y, zoneX0 + 1);
        }

        // За верхней стеной (y=zoneY0) — башня сдвинута вниз на 1, каждые 7 клеток по X
        for (let x = zoneX0 + 1; x <= zoneX1 - 1; x += 7) {
            addTower(zoneY0 + 1, x);
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

    /**
     * Вычисляет общую видимость для всей армии.
     * Враг считается видимым, если его видит хотя бы один юнит армии (с учётом LoS).
     */
    private calculateSharedVisibility(): Unit[] {
        const visibleEnemyGuids = new Set<string>();
        const aliveUnits = this.units.filter(u => u.isAlive);

        for (const unit of aliveUnits) {
            for (const enemy of this.enemyUnits) {
                if (!enemy.isAlive) continue;
                if (visibleEnemyGuids.has(enemy.guid)) continue;

                const dx = enemy.x - unit.x;
                const dy = enemy.y - unit.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= unit.visibility && unit.hasLineOfSight(unit.x, unit.y, enemy.x, enemy.y, this.map)) {
                    visibleEnemyGuids.add(enemy.guid);
                }
            }
        }

        return this.enemyUnits.filter(enemy => visibleEnemyGuids.has(enemy.guid));
    }

    private update(): void {
        const deltaTime = 0.2;
        this.projectiles.length = 0;

        const aliveAllies = this.units.filter(u => u.isAlive);

        for (const unit of this.units) {
            if (unit.isAlive) {
                if (unit.type === 'eblekar' || unit.type === 'pizdoglyad') {
                    (unit as Eblekar).update(this.calculateSharedVisibility(), this.map, deltaTime, aliveAllies);
                } else {
                    unit.update(this.calculateSharedVisibility(), this.map, deltaTime);
                }
            }
        }

        // Тикаем все здания — включая мёртвые взрывоморы, ожидающие respawn
        for (const building of this.buildings) {
            building.update(this.calculateSharedVisibility(), this.map, deltaTime);
        }

        // Удаляем только те здания, что мертвы И не ждут respawn
        this.buildings = this.buildings.filter(b => {
            if (b.type === 'vzryvomor') {
                return b.isAlive || (b as unknown as Vzryvomor).respawn.inProgress;
            }
            return b.isAlive;
        });

        this.units = this.units.filter(unit => {
            return unit.isAlive;
        });

        this.callbacks.update(this.guid!, this.getState());
    }



    public getState(): TArmyState {
        return {
            map: this.map,
            units: this.units.map(u => u.getState()),
            enemyUnits: this.enemyUnits.map(u => u.getState()),
            buildings: [
                ...this.buildings.map(b => b.getState()),
                ...this.enemyBuildings.map(b => ({ ...b, hp: b.hp ?? 0 })),
                ...this.economyBuildings.map(b => ({ ...b, hp: b.hp ?? 0 })),
            ],
            economyUnits: this.economyUnits,
            projectiles: this.projectiles,
            formation: null,
        };
    }

    public getAliveUnits(): Unit[] {
        return this.units.filter(u => u.isAlive);
    }

    public spawnUnit(type: 'sporomet' | 'champigneb' | 'eblekar' | 'pizdoglyad', x: number, y: number, common: Common): { guid: string } | null {
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
            this.units.push(new Sporomet({ guid, type, x, y, speed: 2, attackRange: 10, projectiles: this.projectiles }));
        } else if (type === 'champigneb') {
            this.units.push(new Champigneb({ guid, type, x, y, speed: 3, attackRange: 6 }));
        } else if (type === 'eblekar') {
            this.units.push(new Eblekar({ guid, type, x, y, speed: 1, attackRange: 0, projectiles: this.projectiles }));
        } else if (type === 'pizdoglyad') {
            this.units.push(new Pizdoglyad({ guid, type, x, y, speed: 7, attackRange: 0 }));
        }

        return { guid };
    }


    public spawnBuilding(type: 'vzryvomor' | 'sporovaya_bashnya', x: number, y: number, common: Common): { guid: string } | null {
        const rows = this.map.length;
        const cols = this.map[0]?.length ?? 0;
        const isTilePlaceable = (tx: number, ty: number): boolean => {
            if (ty < 0 || ty >= rows || tx < 0 || tx >= cols) return false;
            const tile = this.map[ty][tx];
            // Споровая башня может стоять на равнине (0) и горах (2);
            // взрывомор — только на равнине (0)
            if (type === 'sporovaya_bashnya') {
                if (tile !== 0 && tile !== 2) return false;
            } else {
                if (tile !== 0) return false;
            }
            // Нельзя поверх существующих зданий (свои + враги + экономика)
            if (this.isTileOccupiedByBuilding(tx, ty)) return false;
            return true;
        };

        const footprint = this.buildingFootprint(type, x, y);
        if (!footprint.every(([tx, ty]) => isTilePlaceable(tx, ty))) return null;

        const guid = common.guid();
        if (type === 'vzryvomor') {
            this.buildings.push(new Vzryvomor({ guid, x, y, attackRange: 12 }));
        } else {
            this.buildings.push(new SporovayaBashnya({ guid, x, y, projectiles: this.projectiles }));
        }
        return { guid };
    }

    /** Тайлы, занимаемые зданием с левым-верхним углом (x,y). 2×2 у споровой башни, 1×1 у остальных. */
    private buildingFootprint(type: string, x: number, y: number, declaredSizeX?: number, declaredSizeY?: number): ReadonlyArray<readonly [number, number]> {
        const defaultSize = type === 'sporovaya_bashnya' ? 2 : 1;
        const sx = declaredSizeX ?? defaultSize;
        const sy = declaredSizeY ?? defaultSize;
        const tiles: [number, number][] = [];
        for (let dy = 0; dy < sy; dy++) {
            for (let dx = 0; dx < sx; dx++) {
                tiles.push([x + dx, y + dy]);
            }
        }
        return tiles;
    }

    /** Проверяет, занят ли тайл футпринтом любого существующего здания (свои/враги/экономика). */
    private isTileOccupiedByBuilding(tx: number, ty: number): boolean {
        const hit = (tiles: ReadonlyArray<readonly [number, number]>): boolean =>
            tiles.some(([bx, by]) => bx === tx && by === ty);

        for (const b of this.buildings) {
            if (hit(this.buildingFootprint(b.type, b.x, b.y))) return true;
        }
        for (const b of this.enemyBuildings) {
            if (hit(this.buildingFootprint(b.type, b.x, b.y, b.sizeX, b.sizeY))) return true;
        }
        for (const b of this.economyBuildings) {
            if (hit(this.buildingFootprint(b.type, b.x, b.y, b.sizeX, b.sizeY))) return true;
        }
        return false;
    }
}