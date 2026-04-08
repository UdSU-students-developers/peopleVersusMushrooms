const BaseManager = require('../BaseManager');
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
     * @returns {{ ok: true, data: object } | { ok: false, error: string }}
     */
    createUnit(data) {
        const guid = data?.guid;
        const x = Number(data?.x);
        const y = Number(data?.y);
        const type = data?.type ?? 'soldier';

        if (guid === null || data?.x === undefined || data?.y === undefined) {
            return { ok: false, error: 'BAD_PAYLOAD' };
        }
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return { ok: false, error: 'BAD_PAYLOAD' };
        }

        // Проверяем залогиненность юзера (isLogin)
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (!user || !user?.isLogin()) {
            return { ok: false, error: 'USER_NOT_LOGGED_IN '};
        }

        // Проверяем наличие армии у этого юзера
        if (!this.army[guid]) {
            return { ok: false, error: 'ARMY_NOT_FOUND' };
        }

        // Находим его армию и вызываем createUnit на уровне Army
        const army = this.army[guid];
        return army.createUnit({ x, y, type });
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

    /* SOCKETS */
    //...
}

module.exports = ArmyManager;