const BaseManager = require('../../../../../global/modules/BaseManager');
const Army = require('../../army/Army');

class ArmyManager extends BaseManager {
    constructor(options) {
        super(options);

        this.army = {};

        // sockets
        if (!this.io) return;
        this.io.on('connection', (socket) => {
        });
        // mediator event subscribers
        this.mediator.subscribe(this.EVENTS.START_GAME, (data) => this.eventStartGame(data));
        this.mediator.subscribe(this.EVENTS.USER_DISCONNECT, (data) => this.eventUserDisconnect(data));
        // mediator trigger setters
        this.mediator.set(this.TRIGGERS.CREATE_UNIT, (data) => this.createUnit(data));
    }

    destructor() {
        this.army.destructor();
    }

    /* PRIVATE */
    updateArmyCallback(guid, data) {
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (user) {
            this.io.to(user.socketId).emit(
                this.SOCKETS.UPDATE_ARMY,
                this.answer.good(data)
            )
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

    /* EVENTS */
    eventStartGame({ guid, map, buildings }) {
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (user) {
            this.army[guid] = new Army({
                map,
                buildings,
                common: this.common,
                guid,
                db: this.db,
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
