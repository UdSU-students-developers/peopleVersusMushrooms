const BaseManager = require('../BaseManager');
const Army = require('../../army/Army');
const Soldier = require('../../army/entities/Soldier');
const BMP = require('../../army/entities/BMP');

class ArmyManager extends BaseManager {
    constructor(options) {
        super(options);

        this.army = {};

        // sockets
        if (!this.io) return;
        this.io.on('connection', () => {
        });
        // mediator event subscribers
        this.mediator.subscribe(this.EVENTS.START_GAME, (data) => this.eventStartGame(data));
        // mediator trigger setters
        this.mediator.set(this.TRIGGERS.SET_UNIT_TARGET, (data) => this.setUnitTarget(data));
        this.mediator.set(this.TRIGGERS.CREATE_UNIT, (data) => this.createUnit(data));
        this.mediator.set(this.TRIGGERS.GET_ALL_UNITS, (data) => this.getAllUnits(data));
    }

    destructor() {
        Object.values(this.army).forEach((army) => army?.destructor());
    }

    /* PRIVATE */
    getArmyByOwnerGuid(ownerGuid) {
        if (!ownerGuid) {
            return null;
        }

        return this.army[ownerGuid] || null;
    }

    findArmyByUnitGuid(unitGuid) {
        if (!unitGuid) {
            return null;
        }

        return Object.values(this.army).find((army) => (
            army.units.some((unit) => String(unit.guid) === String(unitGuid))
        )) || null;
    }

    getSingleArmy() {
        const armies = Object.values(this.army);
        return armies.length === 1 ? armies[0] : null;
    }

    resolveArmy(data = {}) {
        return this.getArmyByOwnerGuid(data.ownerGuid ?? data.userGuid)
            || this.findArmyByUnitGuid(data.guid)
            || this.getSingleArmy();
    }

    updateArmyCallback(guid, data) {
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (user) {
            this.io.to(user.socketId).emit(
                this.SOCKETS.UPDATE_ARMY,
                this.answer.good(data)
            );
        }
    }

    /* TRIGGERS */
    /**
     * mediator.get(SET_UNIT_TARGET, { guid, targetX, targetY }) - alias: unitGuid, x, y
     * @returns {{ ok: true, data: object } | { ok: false, error: string }}
     */
    setUnitTarget(data) {
        const guid = data?.guid;
        const rawTx = data?.targetX;
        const rawTy = data?.targetY;
        if (guid === null || rawTx === undefined || rawTy === null) {
            return { ok: false, error: 'BAD_PAYLOAD' };
        }
        const tx = Number(rawTx);
        const ty = Number(rawTy);
        if (!Number.isFinite(tx) || !Number.isFinite(ty)) {
            return { ok: false, error: 'BAD_PAYLOAD' };
        }

        const army = this.resolveArmy(data);
        if (!army) {
            return { ok: false, error: 'ARMY_NOT_FOUND' };
        }

        const unit = army.units.find((u) => String(u.guid) === String(guid));
        if (!unit) {
            return { ok: false, error: 'UNIT_NOT_FOUND' };
        }
        unit.setTarget(tx, ty);
        return { ok: true, data: unit.get() };
    }

    /**
     * mediator.get(CREATE_UNIT, { guid, x, y, type?, ownerGuid? })
     * type: "soldier" | "bmp" (по умолчанию soldier)
     * @returns {{ ok: true, data: object } | { ok: false, error: string }}
     */
    createUnit(data) {
        const guid = data?.guid;
        const x = Number(data?.x);
        const y = Number(data?.y);
        const type = String(data?.type ?? 'soldier').toLowerCase();
        if (guid === null || data?.x === undefined || data?.y === undefined) {
            return { ok: false, error: 'BAD_PAYLOAD' };
        }
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return { ok: false, error: 'BAD_PAYLOAD' };
        }

        const army = this.resolveArmy(data);
        if (!army) {
            return { ok: false, error: 'ARMY_NOT_FOUND' };
        }

        if (army.units.some((u) => String(u.guid) === String(guid))) {
            return { ok: false, error: 'DUPLICATE_GUID' };
        }
        const options = { guid, x, y };
        const unit = type === 'bmp' ? new BMP(options) : new Soldier(options);
        army.units.push(unit);
        console.log('Юнит создан:', unit.get());
        console.log('Армия:', army.units);
        return { ok: true, data: unit.get() };
    }

    /**
     * mediator.get(GET_ALL_UNITS, { ownerGuid? })
     * @returns {{ ok: true, data: object[] }}
     */
    getAllUnits(data = {}) {
        const army = this.getArmyByOwnerGuid(data.ownerGuid ?? data.userGuid);
        if (army) {
            return { ok: true, data: army.getAllUnits() };
        }

        const units = Object.values(this.army).flatMap((currentArmy) => currentArmy.getAllUnits());
        return { ok: true, data: units };
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
                callbacks: {
                    update: (currentGuid, data) => this.updateArmyCallback(currentGuid, data)
                }
            });
        }
    }

    /* SOCKETS */
    //...
}

module.exports = ArmyManager;
