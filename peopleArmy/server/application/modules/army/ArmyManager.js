const BaseManager = require('../BaseManager');
const Army = require('../../army/Army');
const Soldier = require('../../army/entities/Soldier');
const BMP = require('../../army/entities/BMP');

class ArmyManager extends BaseManager {
    constructor(options) {
        super(options);

        this.army = {};

        this.unitTypesByCode = {};
        this.unitTypesLoaded = false;
        this.unitTypesLoadError = null;

        this.db.getUnitTypes((error, rows) => {
            if (error) {
                this.unitTypesLoadError = error;
                this.unitTypesLoaded = true;
                return;
            }

            if (rows) {
                for (const row of rows) {
                    this.unitTypesByCode[String(row.code).toLowerCase()] = {
                        HP: row.hp,
                        SPEED: row.speed,
                        RANGE: row.unit_range,
                        VISIBLE: row.visible,
                    };
                }
            }

            this.unitTypesLoaded = true;
        });

        // sockets
        if (!this.io) return;
        this.io.on('connection', (socket) => {
        });
        // mediator event subscribers
        this.mediator.subscribe(this.EVENTS.START_GAME, (data) => this.eventStartGame(data));
        // mediator trigger setters
        this.mediator.set(this.TRIGGERS.SET_UNIT_TARGET, (data) => this.setUnitTarget(data));
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
     * mediator.get(SET_UNIT_TARGET, { guid, targetX, targetY }) — alias: unitGuid, x, y
     * @returns {{ ok: true, data: object } | { ok: false, error: string }}
     */
    setUnitTarget(data) {
        const guid = data?.guid;
        const rawTx = data?.targetX
        const rawTy = data?.targetY
        if (guid === null || rawTx === undefined || rawTy === null) {
            return { ok: false, error: 'BAD_PAYLOAD' };
        }
        const tx = Number(rawTx);
        const ty = Number(rawTy);
        if (!Number.isFinite(tx) || !Number.isFinite(ty)) {
            return { ok: false, error: 'BAD_PAYLOAD' };
        }
        const unit = this.army.units.find((u) => String(u.guid) === String(guid));
        if (!unit) {
            return { ok: false, error: 'UNIT_NOT_FOUND' };
        }
        unit.setTarget(tx, ty);
        return { ok: true, data: unit.get() };
    }

    /**
     * mediator.get(CREATE_UNIT, { guid, x, y, type? })
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
        if (!this.unitTypesLoaded) {
            return { ok: false, error: 'UNIT_TYPES_NOT_READY' };
        }
        if (this.unitTypesLoadError) {
            return { ok: false, error: 'UNIT_TYPES_LOAD_FAILED' };
        }
        if (this.army.units.some((u) => String(u.guid) === String(guid))) {
            return { ok: false, error: 'DUPLICATE_GUID' };
        }
        const stats = this.unitTypesByCode[type];
        if (!stats) {
            return { ok: false, error: 'BAD_PAYLOAD' };
        }
        const options = { guid, x, y, stats };
        const unit = type === 'bmp' ? new BMP(options) : new Soldier(options);
        this.army.units.push(unit);
        console.log('Юнит создан:', unit.get());
        console.log('Армия:', this.army.units);
        return { ok: true, data: unit.get() };
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
                    update: (guid, data) => this.updateArmyCallback(guid, data)
                }
            });
        }
    }

    /* SOCKETS */
    //...
}

module.exports = ArmyManager;
