import BaseManager, { TManagerOptions } from '../BaseManager';
import CONFIG from '../../../config';
import { Army, TMap, TArmyState, TBuildingInput } from '../../army/Army';
import { Socket } from 'socket.io';

const GLOBAL_CONFIG = require('../../../../../global/globalConfig');

const { GAME_STATE, GAME_OVER, LOBBY_START } = CONFIG.SOCKET;

type TStartGame = { guid: string; map?: TMap; buildings: TBuildingInput[]; mapGuid: string };
type TTakeDamage = { armyGuid: string; unitGuid: string; amount: number; type: string };
type TMoveUnit = { armyGuid: string; unitGuid: string; x: number; y: number };
type TGetArmy = string;
type TSpawnUnit = { armyGuid: string; type: 'sporomet' | 'champigneb' | 'eblekar'; x: number; y: number };
type TUser = { guid: string; token: string; socketId: string; name: string };

type TVisibleEntity = {
    guid: string;
    type: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
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

        if (!this.io) return;
        this.io.on('connection', (socket: Socket) => {
            socket.on(LOBBY_START, (data: { guid?: string; token?: string }) => this.socketLobbyStart(data, socket));
        });
    }

    private triggerTakeDamage({ armyGuid, unitGuid, amount, type }: TTakeDamage): boolean {
        const army = this.army[armyGuid];
        if (!army) return false;

        const sanitizedAmount = Math.max(0, amount);

        // Ищем цель среди юнитов
        const unit = army.units.find(u => u.guid === unitGuid);
        if (unit) {
            unit.takeDamage(sanitizedAmount, type);
            this.sendToMushroomsEconomy('/takeDamage', { armyGuid, unitGuid, amount: sanitizedAmount, type });
            return true;
        }

        // Ищем цель среди зданий
        const building = army.buildings.find(b => b.guid === unitGuid);
        if (building) {
            if ('takeDamage' in building && typeof building.takeDamage === 'function') {
                building.takeDamage(sanitizedAmount, type);
            }
            this.sendToMushroomsEconomy('/takeDamage', { armyGuid, unitGuid, amount: sanitizedAmount, type });
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

    private async updateArmyCallback(guid: string, armyState: TArmyState) {
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid) as { socketId: string } | null;
        if (!user) return;

        this.io.to(user.socketId).emit(GAME_STATE, this.answer.good(armyState));

        const army = this.army[guid];
        if (army && army.getAliveUnits().length === 0) {
            this.io.to(user.socketId).emit(GAME_OVER, this.answer.good({ message: 'Все юниты погибли' }));
            this.destroyArmy(guid);
            return;
        }
        
        if (army && army.buildings.length === 0) {
            this.io.to(user.socketId).emit(GAME_OVER, this.answer.good({ message: 'Все здания разрушены' }));
            this.destroyArmy(guid);
            return;
        }

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
                maxHp: entity.maxHp,
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

        this.army[guid] = new Army({
            mapGuid,
            map: resolvedMap,
            buildings,
            common: this.common,
            guid,
            callbacks: {
                update: (guid: string, armyState: TArmyState) => this.updateArmyCallback(guid, armyState)
            }
        });
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

        const map: (number | null)[][] = Array.from({ length: 100 }, () =>
            Array.from({ length: 100 }, (_, col) => (col === 10 ? 1 : 0))
        );

        const buildings: TBuildingInput[] = [
            { guid: this.common.guid(), type: 'house', x: 50, y: 30, hp: 200, maxHp: 200 },
            { guid: this.common.guid(), type: 'barracks', x: 60, y: 50, hp: 300, maxHp: 300 },
            { guid: this.common.guid(), type: 'tower', x: 56, y: 70, hp: 150, maxHp: 150 },
            { guid: this.common.guid(), type: 'sporovaya_bashnya', x: 40, y: 20, hp: 500, maxHp: 500, sizeX: 2, sizeY: 2 },
            { guid: this.common.guid(), type: 'sporovaya_bashnya', x: 40, y: 60, hp: 500, maxHp: 500, sizeX: 2, sizeY: 2 },
            { guid: this.common.guid(), type: 'vzryvomor', x: 80, y: 20, hp: 70, maxHp: 70, attackRange: 7 },
            { guid: this.common.guid(), type: 'vzryvomor', x: 60, y: 60, hp: 70, maxHp: 70, attackRange: 7 },
            { guid: this.common.guid(), type: 'vzryvomor', x: 40, y: 80, hp: 70, maxHp: 70, attackRange: 7 },
        ];

        const mapGuid = this.common.guid();

        socket.emit(LOBBY_START, this.answer.good(true));
        this.mediator.call(this.EVENTS.START_GAME, { guid, map, buildings, mapGuid });
    }
}

export default ArmyManager;
