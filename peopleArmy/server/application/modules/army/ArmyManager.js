const CONFIG = require('../../../config');
const BaseManager = require('../../../../../global/modules/BaseManager');
const { URLS, MAP } = require('../../../../../global/globalConfig');
const Army = require('../../army/Army');
const { UPDATE_ARMY } = CONFIG.SOCKETS;

class ArmyManager extends BaseManager {
    constructor(options) {
        super(options);

        // хранит армии
        this.army = {};
        this.unitTypes = {};
        this.unitTypesLoaded = false;

        // хранит данные о лобби (mapGuid, guids))
        this.lobbyData = {};

        // sockets
        if (!this.io) return;
        this.io.on('connection', (socket) => {});
        // mediator event subscribers
        this.mediator.subscribe(this.EVENTS.START_GAME, (data) => this.eventStartGame(data));
        this.mediator.subscribe(this.EVENTS.DELETE_USER, (data) => this.eventUserDisconnect(data));
        // mediator trigger setters
        this.mediator.set(this.TRIGGERS.CREATE_UNIT, (data) => this.createUnit(data));
        this.mediator.set(this.TRIGGERS.UNIT_TAKE_DAMAGE, (data) => this.unitTakeDamage(data));
        this.mediator.set(this.TRIGGERS.MOVE_UNIT, (data) => this.unitMove(data));
    }

    async loadUnitTypes() {
        if (this.unitTypesLoaded) {
            return this.unitTypes;
        }
        const types = await this.db.getUnitTypes();
        this.unitTypes = types || {};
        this.unitTypesLoaded = true;
        return this.unitTypes;
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
        const visibility = await this.sendToMap(`${URLS.GET_VISIBILITY}`, { mapGuid: army.mapGuid, userGuid: guid });
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
            return this.answer.bad(400);
        }
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return this.answer.bad(400);
        }

        // Проверяем залогиненность юзера (isLogin)
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (!user || !user?.isLogin()) {
            return this.answer.bad(11);
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
     * mediator.get(UNIT_TAKE_DAMAGE, { userGuid, unitGuid, damage })
     * userGuid — guid пользователя (владельца армии)
     * unitGuid — guid юнита, которому наносится урон
     * damage — количество урона
     */
    unitTakeDamage(data) {
        const userGuid = data?.userGuid;
        const unitGuid = data?.unitGuid;
        const damage = Number(data?.damage);

        if (!userGuid || !unitGuid || !Number.isFinite(damage)) {
            return this.answer.bad(400);
        }

        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, userGuid);
        if (!user || !user?.isLogin()) {
            return this.answer.bad(11);
        }

        const army = this.army[userGuid];
        if (!army) {
            return this.answer.bad(400);
        }

        const result = army.unitTakeDamage({ guid: unitGuid, damage });
        if (!result?.ok) {
            return this.answer.bad(404);
        }

        return this.answer.good(result.data);
    }

    unitMove(data) {
        const userGuid = data?.userGuid;
        const unitGuid = data?.unitGuid;
        const x = Number(data?.x);
        const y = Number(data?.y);
        if (!userGuid || !unitGuid || !Number.isFinite(x) || !Number.isFinite(y)) {
            return this.answer.bad(400);
        }
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, userGuid);
        if (!user || !user?.isLogin()) {
            return this.answer.bad(11);
        }
        const army = this.army[userGuid];
        if (!army) {
            return this.answer.bad(400);
        }
        const unit = army.units.find(unit => unit.guid === unitGuid);
        if (!unit) {
            return this.answer.bad(400);
        }
        unit.setTarget(x, y);
        return this.answer.good(true);
    }

    async damageMushroomsUnit({ armyGuid="123efthgfrds", unitGuid, amount }) {
        if (!armyGuid || !unitGuid || !Number.isFinite(Number(amount))) {
            return null;
        }
        return this.sendToMushroomsArmy('/takeDamage', {
            armyGuid,
            unitGuid,
            amount: Number(amount),
        });
    }

    /* EVENTS */
    async eventStartGame({ mapGuid, guids }) {
        if (!mapGuid || !guids || !guids.peopleArmy) {
            return;
        }

        const guid = guids.peopleArmy;
        this.lobbyData[guid] = { mapGuid, guids };

        const map = await this.sendToMap(`${URLS.GET_RELIEF}`, { mapGuid, userGuid: guid });
        if (!map || !Array.isArray(map)) {
            return;
        }
        await this.loadUnitTypes();

        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (user) {
            if (this.army[guid]) {
                this.army[guid].destructor();
                delete this.army[guid];
            }
            this.army[guid] = new Army({ guids, mapGuid, map, buildings: [], unitTypes: this.unitTypes, common: this.common, guid,
                callbacks: {
                    update: (guid, data) => this.updateArmyCallback(guid, data),
                    takeDamage: (payload) => this.damageMushroomsUnit(payload),
                }
            });
            this.io.to(user.socketId).emit(
                this.SOCKET.START_GAME,
                this.answer.good({ map })
            );
        }
    }

    eventUserDisconnect(guid) {
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