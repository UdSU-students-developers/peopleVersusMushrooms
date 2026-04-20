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
        this.mediator.set(this.TRIGGERS.UNIT_TAKE_DAMAGE, (data) => this.unitTakeDamage(data));
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

    /** 
     * mediator.get(UNIT_TAKE_DAMAGE, { guid, damage })
     * guid — guid юнита (не пользователя); ищем юнита во всех армиях
     * damage — количество нанесённого урона
     */
    unitTakeDamage(data) {
        const guid = data?.guid;
        const damage = Number(data?.damage);

        if (!guid || !Number.isFinite(damage)) {
            return { ok: false, error: 'BAD_PAYLOAD' };
        }

        // Ищем юнита по guid во всех армиях
        for (const userGuid in this.army) {
            const army = this.army[userGuid];
            const result = army.unitTakeDamage({ guid, damage });
            if (result.ok) {
                return result;
            }
        }

        return { ok: false, error: 'UNIT_NOT_FOUND' };
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