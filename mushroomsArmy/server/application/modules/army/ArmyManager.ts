import BaseManager, { TManagerOptions } from '../BaseManager';
import CONFIG from '../../../config';
import { Army, TMap, TArmyState } from '../../army/Army';
import User from '../user/User';

const { GAME_STATE, GAME_OVER } = CONFIG.SOCKET;

type TStartGame = { guid: string; map: TMap; buildings: any[]; mapGuid: string };

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

        const unit = army.units.find(u => u.guid === unitGuid);
        if (!unit) return false;

        unit.takeDamage(amount, type);

        this.sendToMushroomsEconomy('/takeDamage', { armyGuid, unitGuid, amount, type });

        return true;
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
            this.io.to(user.socketId).emit(GAME_OVER, this.answer.good({ message: 'пососали' }));
            this.destroyArmy(guid);
            return;
        }

        const { units, slimePuddles } = armyState;

        await this.sendToMap('/updateMushroomArmy', army.mapGuid, army.guid, { units, slimePuddles });

        const visibility = await this.sendToMap<null, TVisibilityResponse>(
            '/getVisibility', army.mapGuid, army.guid
        );

        if (visibility?.entities && visibility.entities.length > 0) {
            const enemyEntities = visibility.entities.map(entity => ({
                guid: entity.guid,
                type: entity.type,
                x: entity.x,
                y: entity.y,
                hp: entity.hp,
                maxHp: entity.maxHp,
                isAlive: true,
                update: () => {},
                getState: () => ({})
            }));
            army.updateEnemyEntities(enemyEntities as any);
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

        console.log(`[ArmyManager] Армия создана для игрока ${guid}`);
    }
}

export default ArmyManager;