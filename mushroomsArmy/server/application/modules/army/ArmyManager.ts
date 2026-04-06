import BaseManager, { TManagerOptions } from '../BaseManager';
import CONFIG from '../../../config';
import { Army, TMap, ArmyState } from '../../army/Army';
import User from '../user/User';

const { GAME_STATE, GAME_OVER } = CONFIG.SOCKET;

type TStartGame = { guid: string; map: TMap; buildings: any[], mapGuid: string };

class ArmyManager extends BaseManager {
    private army: { [guid: string]: Army };

    constructor(options: TManagerOptions) {
        super(options);

        this.army = {};

        // Подписки на события медиатора
        this.mediator.subscribe(this.EVENTS.START_GAME, (data: TStartGame) => this.eventStartGame(data));
    }

    /* ПРИВАТНЫЕ МЕТОДЫ */
    private async updateArmyCallback(guid: string, armyState: ArmyState) {
        const user = this.mediator.get<User, string>(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (!user) return;

        this.io.to(user.socketId).emit(GAME_STATE, this.answer.good(armyState));

        // Проверяем: если все юниты мертвы — game over
        const army = this.army[guid];
        if (army && army.getAliveUnits().length === 0) {
            this.io.to(user.socketId).emit(GAME_OVER, this.answer.good({ message: 'Все юниты погибли' }));
            this.destroyArmy(guid);
        }

        const { units, slimePuddles } = armyState;
        // послать запрос в карту

        const answer = await this.sendToMap(
            '/updateMushroomArmy', army.mapGuid, army.guid, { units, slimePuddles }
        );
        // если ответ хороший, то спросить у карты обновление видимости
        const visibility = await this.sendToMap(
            '/getVisibility', army.mapGuid, army.guid
        );
        // если видимость пришла хорошей, то обновить видимость армии
        // и пересчитать цели юнитов (вдруг увидел нового врага или здание)
        //...
    }

    private destroyArmy(guid: string): void {
        const army = this.army[guid];
        if (army) {
            army.destructor();
        }
        delete this.army[guid];
    }

    /* СОБЫТИЯ */
    private eventStartGame({ guid, map, buildings, mapGuid }: TStartGame): void {
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (!user) return;

        // Если у игрока уже есть армия — уничтожаем старую
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
                update: (guid: string, armyState: ArmyState) => this.updateArmyCallback(guid, armyState)
            }
        });

        console.log(`[ArmyManager] Армия создана для игрока ${guid}`);
    }
}

export default ArmyManager;
