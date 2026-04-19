import BaseManager, { TManagerOptions } from '../BaseManager';
import CONFIG from '../../../config';
import { Army, TMap, TArmyState, TBuildingInput } from '../../army/Army';
import User from '../user/User';

const { GAME_STATE, GAME_OVER } = CONFIG.SOCKET;

type TStartGame = { guid: string; map: TMap; buildings: TBuildingInput[]; mapGuid: string };

type TVisibleEntity = {
    guid: string;
    type: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
};

type TVisibilityResponse = {
    entities: TVisibleEntity[];
};

class ArmyManager extends BaseManager {
    private army: { [guid: string]: Army };

    constructor(options: TManagerOptions) {
        super(options);

        this.army = {};

        this.mediator.subscribe(this.EVENTS.START_GAME, (data: TStartGame) => this.eventStartGame(data));

        this.mediator.set(CONFIG.MEDIATOR.TRIGGERS.TAKE_DAMAGE_HANDLER, (data: { armyGuid: string; unitGuid: string; amount: number; type: string }) =>
            this.triggerTakeDamage(data)
        );

        this.mediator.set(CONFIG.MEDIATOR.TRIGGERS.DESTROY_ARMY, (guid: string) => this.destroyArmy(guid));
    }

    private triggerTakeDamage({ armyGuid, unitGuid, amount, type }: {
        armyGuid: string; unitGuid: string; amount: number; type: string;
    }): boolean {
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

    private async updateArmyCallback(guid: string, armyState: TArmyState) {
        const user = this.mediator.get<User, string>(this.TRIGGERS.GET_USER_BY_GUID, guid);
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

        const { units, slimePuddles, buildings } = armyState;

        // Отправляем юниты и здания на отдельные эндпоинты карты
        await this.send<{ mapGuid: string; userGuid: string; units: TArmyState['units'] }>(
            `${CONFIG.SERVICES.MAP_URL}/updateUnitsHandler`,
            { mapGuid: army.mapGuid, userGuid: army.guid, units }
        );

        await this.send<{ mapGuid: string; userGuid: string; buildings: TArmyState['buildings'] }>(
            `${CONFIG.SERVICES.MAP_URL}/updateBuildingsHandler`,
            { mapGuid: army.mapGuid, userGuid: army.guid, buildings }
        );

        const visibility = await this.sendToMap<null, TVisibilityResponse>(
            '/getVisibility', army.mapGuid, army.guid
        );

        if (visibility?.entities && visibility.entities.length > 0) {
            const enemyEntities: TBuildingInput[] = visibility.entities.map(entity => ({
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

    private eventStartGame({ guid, map, buildings, mapGuid }: TStartGame): void {
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (!user) return;

        if (this.army[guid]) {
            this.destroyArmy(guid);
        }

        this.army[guid] = new Army({
            mapGuid,
            map,
            buildings,
            common: this.common,
            guid,
            callbacks: {
                update: (guid: string, armyState: TArmyState) => this.updateArmyCallback(guid, armyState)
            }
        });
    }
}

export default ArmyManager;