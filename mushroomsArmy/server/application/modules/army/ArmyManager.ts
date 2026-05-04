import BaseManager, { TManagerOptions } from '../BaseManager';
import CONFIG from '../../../config';
import { Army, TMap, TArmyState, TBuildingInput } from '../../army/Army';
import { Socket } from 'socket.io';

const GLOBAL_CONFIG = require('../../../../../global/globalConfig');

const { GAME_STATE, GAME_OVER, LOBBY_START, GAME_STARTED } = CONFIG.SOCKET;

type TStartGame = { guid: string; map?: TMap; buildings: TBuildingInput[]; mapGuid: string };
type TTakeDamage = { armyGuid: string; unitGuid: string; amount: number };
type TMoveUnit = { armyGuid: string; unitGuid: string; x: number; y: number };
type TGetArmy = string;
type TSpawnUnit = { armyGuid: string; type: 'sporomet' | 'champigneb' | 'eblekar'; x: number; y: number };
type TSpawnBuildingUnit = { armyGuid: string; type: 'vzryvomor' | 'sporovaya_bashnya'; x: number; y: number };
type TUser = { guid: string; token: string; socketId: string; name: string };

type TVisibleEntity = {
    guid: string;
    type: string;
    x: number;
    y: number;
    hp: number;
};

type TVisibilityResponse = {
    units: TVisibleEntity[];
    buildings: TVisibleEntity[];
};

type TReliefResponse = TMap;

class ArmyManager extends BaseManager {
    private army: { [guid: string]: Army };

    constructor(options: TManagerOptions) {
        super(options);

        this.army = {};

        this.mediator.subscribe(this.EVENTS.START_GAME, (data: unknown) => this.eventStartGame(data as TStartGame));

        this.mediator.set(CONFIG.MEDIATOR.TRIGGERS.TAKE_DAMAGE_HANDLER, (data: unknown) =>
            this.triggerTakeDamage(data as TTakeDamage)
        );

        this.mediator.set(CONFIG.MEDIATOR.TRIGGERS.DESTROY_ARMY, (data: unknown) => this.destroyArmy(data as string));

        this.mediator.set(CONFIG.MEDIATOR.TRIGGERS.MOVE_UNIT, (data: unknown) =>
            this.triggerMoveUnit(data as TMoveUnit)
        );

        this.mediator.set(CONFIG.MEDIATOR.TRIGGERS.GET_ARMY, (data: unknown) =>
            this.triggerGetArmy(data as TGetArmy)
        );

        this.mediator.set(CONFIG.MEDIATOR.TRIGGERS.SPAWN_UNIT, (data: unknown) =>
            this.triggerSpawnUnit(data as TSpawnUnit)
        );

        this.mediator.set(CONFIG.MEDIATOR.TRIGGERS.SPAWN_BUILDING, (data: unknown) => 
            this.triggerSpawnBuildingUnit(data as TSpawnBuildingUnit)
        );

        if (!this.io) return;
        this.io.on('connection', (socket: Socket) => {
            socket.on(LOBBY_START, (data: { guid?: string; token?: string }) => this.socketLobbyStart(data, socket));
            socket.on(CONFIG.SOCKET.SPAWN_UNIT, (data: { guid?: string; token?: string; type?: string; x?: number; y?: number }) => this.socketSpawnUnit(data, socket));
        });
    }

    private triggerTakeDamage({ armyGuid, unitGuid, amount }: TTakeDamage): boolean {
        const army = this.army[armyGuid];
        if (!army) return false;

        const sanitizedAmount = Math.max(0, amount);

        // Ищем цель среди юнитов
        const unit = army.units.find(u => u.guid === unitGuid);
        if (unit) {
            unit.takeDamage(sanitizedAmount);
            return true;
        }

        // Ищем цель среди зданий
        const building = army.buildings.find(b => b.guid === unitGuid);
        if (building) {
            if ('takeDamage' in building && typeof building.takeDamage === 'function') {
                building.takeDamage(sanitizedAmount);
            }
            return true;
        }

        return false;
    }

    private triggerMoveUnit({ armyGuid, unitGuid, x, y }: TMoveUnit): boolean {
        const army = this.army[armyGuid];
        if (!army) return false;

        const unit = army.units.find(u => u.guid === unitGuid);
        if (!unit) return false;

        (unit as any).targetX = x;
        (unit as any).targetY = y;

        return true;
    }

    private triggerGetArmy(armyGuid: TGetArmy): TArmyState | null {
        const army = this.army[armyGuid];
        if (!army) return null;

        return army.getState();
    }

    private triggerSpawnUnit({ armyGuid, type, x, y }: TSpawnUnit): { guid: string } | null {
        const army = this.army[armyGuid];
        if (!army) return null;

        return army.spawnUnit(type, x, y, this.common);
    }

    private triggerSpawnBuildingUnit({ armyGuid, type, x, y }: TSpawnBuildingUnit): { guid: string } | null {
        const army = this.army[armyGuid];
        if (!army) return null;

        return army.spawnBuilding(type, x, y, this.common);
    }

    private buildFogMap(armyState: TArmyState, fullMap: TMap, visionRadius: number = 8): TMap {
        const rows = fullMap.length;
        const cols = fullMap[0]?.length ?? 0;
        const visible = new Uint8Array(rows * cols);

        const reveal = (cx: number, cy: number, r: number) => {
            const x0 = Math.max(0, Math.floor(cx - r));
            const x1 = Math.min(cols - 1, Math.ceil(cx + r));
            const y0 = Math.max(0, Math.floor(cy - r));
            const y1 = Math.min(rows - 1, Math.ceil(cy + r));
            for (let y = y0; y <= y1; y++) {
                for (let x = x0; x <= x1; x++) {
                    visible[y * cols + x] = 1;
                }
            }
        };

        for (const unit of armyState.units) {
            if (unit.hp > 0) reveal(unit.x, unit.y, visionRadius);
        }
        for (const building of armyState.buildings) {
            const hp = building.hp ?? 0;
            if (hp > 0 && building.type !== 'house' && building.type !== 'barracks' && building.type !== 'tower') {
                const sizeX = building.sizeX ?? 1;
                const sizeY = building.sizeY ?? 1;
                reveal(building.x + sizeX / 2, building.y + sizeY / 2, visionRadius);
            }
        }

        return fullMap.map((row, y) =>
            row.map((tile, x) => (visible[y * cols + x] ? tile : null))
        );
    }

    private async updateArmyCallback(guid: string, armyState: TArmyState) {
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid) as { socketId: string } | null;
        if (!user) return;

        const army = this.army[guid];
        const fogMap = army ? this.buildFogMap(armyState, army.map) : armyState.map;
        this.io.to(user.socketId).emit(GAME_STATE, this.answer.good({ ...armyState, map: fogMap }));

        if (army && army.getAliveUnits().length === 0) {
            this.io.to(user.socketId).emit(GAME_OVER, this.answer.good({ message: 'Все юниты погибли' }));
            this.destroyArmy(guid);
            return;
        }
        
        // if (army && army.buildings.length === 0) {
        //     this.io.to(user.socketId).emit(GAME_OVER, this.answer.good({ message: 'Все здания разрушены' }));
        //     this.destroyArmy(guid);
        //     return;
        // }

        const { units, buildings } = armyState;

        // Отправляем юниты и здания на карту
        // карта читает поля units / buildings (см. useUpdateUnitsHandler.js / useUpdateBuildingsHandler.js)
        await this.send<{ mapGuid: string; userGuid: string; units: TArmyState['units'] }>(
            `${GLOBAL_CONFIG.MAP.URL}${GLOBAL_CONFIG.URLS.UPDATE_UNITS}`,
            { mapGuid: army.mapGuid, userGuid: army.guid, units }
        );

        await this.send<{ mapGuid: string; userGuid: string; buildings: TArmyState['buildings'] }>(
            `${GLOBAL_CONFIG.MAP.URL}${GLOBAL_CONFIG.URLS.UPDATE_BUILDINGS}`,
            { mapGuid: army.mapGuid, userGuid: army.guid, buildings }
        );

        // карта возвращает { units, buildings } (см. Map.getVisbileEntitiesByRole)
        const visibility = await this.sendToMap<TVisibilityResponse>(
            GLOBAL_CONFIG.URLS.GET_VISIBILITY, army.mapGuid, army.guid
        );

        const visibleEnemies: TVisibleEntity[] = [
            ...(visibility?.units ?? []),
            ...(visibility?.buildings ?? []),
        ];

        if (visibleEnemies.length > 0) {
            const enemyEntities: TBuildingInput[] = visibleEnemies.map(entity => ({
                guid: entity.guid,
                type: entity.type,
                x: entity.x,
                y: entity.y,
                hp: entity.hp,
            }));
            army.updateEnemyEntities(enemyEntities);
        }
    }

    private destroyArmy(guid: string): void {
        const army = this.army[guid];
        if (army) {
            army.destructor();
        }
        delete this.army[guid];
    }

     private async eventStartGame({ guid, map, buildings, mapGuid }: TStartGame): Promise<void> {
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (!user) return;

        if (this.army[guid]) {
            this.destroyArmy(guid);
        }
        let resolvedMap = map;

        if (!resolvedMap) {
            const relief = await this.send<{ mapGuid: string; userGuid: string }, TReliefResponse>(
                `${GLOBAL_CONFIG.MAP.URL}${GLOBAL_CONFIG.URLS.GET_RELIEF}`,
                { mapGuid, userGuid: guid }
            );

            if (!relief || !Array.isArray(relief)) {
                return;
            }

            resolvedMap = relief;
        }

        let finalBuildings = buildings;
        if (!finalBuildings || finalBuildings.length === 0) {
            finalBuildings = Army.generateDefensiveLayout(resolvedMap, this.common);
        }

        this.army[guid] = new Army({
            mapGuid,
            map: resolvedMap,
            buildings: finalBuildings,
            common: this.common,
            guid,
            callbacks: {
                update: (guid: string, armyState: TArmyState) => this.updateArmyCallback(guid, armyState)
            }
        });

        const userObj = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid) as TUser | null;
        if (userObj?.socketId) {
            this.io.to(userObj.socketId).emit(GAME_STARTED, this.answer.good(true));
        }
    }

    private socketLobbyStart({ guid, token }: { guid?: string; token?: string }, socket: Socket): void {
        if (!guid || !token) {
            socket.emit(LOBBY_START, this.answer.bad(242));
            return;
        }

        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid) as TUser | null;
        if (!user || user.token !== token) {
            socket.emit(LOBBY_START, this.answer.bad(242));
            return;
        }

        user.socketId = socket.id;
        socket.emit(LOBBY_START, this.answer.good(true));
    }

    private socketSpawnUnit({ guid, token, type, x, y }: { guid?: string; token?: string; type?: string; x?: number; y?: number }, socket: Socket): void {
        if (!guid || !token || !type || x === undefined || y === undefined) return;

        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid) as TUser | null;
        if (!user || user.token !== token) return;

        const validTypes: Array<'sporomet' | 'champigneb' | 'eblekar'> = ['sporomet', 'champigneb', 'eblekar'];
        if (!validTypes.includes(type as 'sporomet' | 'champigneb' | 'eblekar')) return;

        this.triggerSpawnUnit({ armyGuid: guid, type: type as 'sporomet' | 'champigneb' | 'eblekar', x, y });
    }
}

export default ArmyManager;
