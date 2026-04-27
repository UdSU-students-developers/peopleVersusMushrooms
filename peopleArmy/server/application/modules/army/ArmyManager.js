const CONFIG = require('../../../config');
const BaseManager = require('../../../../../global/modules/BaseManager');
const { URLS, MAP } = require('../../../../../global/globalConfig');
const Army = require('../../army/Army');
const { UPDATE_ARMY } = CONFIG.SOCKETS;

class ArmyManager extends BaseManager {
    constructor(options) {
        super(options);

        this.army = {};

        // sockets
        if (!this.io) return;
        this.io.on('connection', (socket) => {});
        // mediator event subscribers
        this.mediator.subscribe(this.EVENTS.START_GAME, (data) => this.eventStartGame(data));
        this.mediator.subscribe(this.EVENTS.USER_DISCONNECT, (data) => this.eventUserDisconnect(data));
        // mediator trigger setters
        this.mediator.set(this.TRIGGERS.CREATE_UNIT, (data) => this.createUnit(data));
        this.mediator.set(this.TRIGGERS.UNIT_TAKE_DAMAGE, (data) => this.unitTakeDamage(data));
    }

    destructor() {
        this.army.destructor();
    }

    /* PRIVATE */
    async updateArmyCallback(guid, data) {
        const army = this.army[guid];
        if (!army?.mapGuid) {
            return;
        }
        // послать в карту И в экономику изменение положения юнитов (просто послать юниты)
        //...
        // запросить видимость
        const visibility = await this.sendToMap(`${URLS.GET_VISIBILITY}`, { mapGuid: army.mapGuid, guid });
        if (visibility) {
            army.setVisibility(visibility);
        }

        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (user) {
            this.io.to(user.socketId).emit(
                UPDATE_ARMY,
                this.answer.good(army.get())
            );
        }
    }

    /* TRIGGERS */

    /**
     * mediator.get(CREATE_UNIT, { guid, x, y, type? })
     * guid — guid пользователя
     * type: "soldier" | "bmp" (по умолчанию soldier)
     * @returns {{ result: "ok", data: object } | { result: "error", error: string, code: number }}
     */
    createUnit(data) {
        const guid = data?.guid;
        const x = Number(data?.x);
        const y = Number(data?.y);
        const type = data?.type ?? 'soldier';

        if (guid === null || data?.x === undefined || data?.y === undefined) {
            return this.answer.bad(242);
        }
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return this.answer.bad(400);
        }

        // Проверяем залогиненность юзера (isLogin)
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (!user || !user?.isLogin()) {
            return this.answer.bad(1004);
        }

        // Проверяем наличие армии у этого юзера
        if (!this.army[guid]) {
            return this.answer.bad(400);
        }

        // Находим его армию и вызываем createUnit на уровне Army
        const army = this.army[guid];
        const result = army.createUnit({ x, y, type });
        if (!result?.ok) {
            return this.answer.bad(400);
        }
        return this.answer.good(result.data);
    }

    /**
     * mediator.get(UNIT_TAKE_DAMAGE, { guid, damage })
     * guid — guid юнита, которому наносится урон
     * damage — количество урона
     */
    unitTakeDamage(data) {
        const guid = data?.guid;
        const damage = Number(data?.damage);

        if (!guid || !Number.isFinite(damage)) {
            return this.answer.bad(400);
        }

        // Поиск юнита во всех армиях
        for (const ownerGuid in this.army) {
            const army = this.army[ownerGuid];
            const result = army.unitTakeDamage({ guid, damage });
            if (result?.ok) {
                return this.answer.good(result.data);
            }
        }

        return this.answer.bad(404);
    }

    /* EVENTS */
    //eventStartGame({ guid, map, buildings, mapGuid = null }) {
    eventStartGame({ guids, startPoint }) {
        const guid = guids.peopleArmy;
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (user) {
            this.army[guid] = new Army({guids, startPoint, mapGuid, common: this.common, guid, db: this.db,
            callbacks: {
                    update: (guid, data) => this.updateArmyCallback(guid, data)
            }
            });
        }
    }

    eventUserDisconnect({ guid }) {
        if (!guid || !this.army[guid]) {
            return;
        }
        this.army[guid].destructor();
        delete this.army[guid];
        this.updateArmyCallback(guid, { units: [] });
        console.log(`армия с guid: ${guid} уничтожена`);
    }

    /* SOCKETS */
    //...
}

module.exports = ArmyManager;