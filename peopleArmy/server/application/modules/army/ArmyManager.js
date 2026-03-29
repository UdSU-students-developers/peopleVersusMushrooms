const BaseManager = require('../BaseManager');
const Army = require('../../army/Army');
const Soldier = require('../../army/entities/Soldier');
const BMP = require('../../army/entities/BMP');

class ArmyManager extends BaseManager {
    constructor(options) {
        super(options);

        this.army = new Army({
            map: null,
            buildings: [],
            common: this.common,
            guid: null,
        });

        this.mediator.set(this.TRIGGERS.SET_UNIT_TARGET, (data) => this.setUnitTarget(data));
        this.mediator.set(this.TRIGGERS.CREATE_UNIT, (data) => this.createUnit(data));
        this.mediator.set(this.TRIGGERS.GET_ALL_UNITS, () => this.getAllUnits());
    }

    /**
     * mediator.get(SET_UNIT_TARGET, { guid, targetX, targetY }) — alias: unitGuid, x, y
     * @returns {{ ok: true, data: object } | { ok: false, error: string }}
     */
    setUnitTarget(data) {
        const guid = data?.guid;
        const rawTx = data?.targetX
        const rawTy = data?.targetY
        if ( guid === null || rawTx === undefined || rawTy === null) {
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
        if (this.army.units.some((u) => String(u.guid) === String(guid))) {
            return { ok: false, error: 'DUPLICATE_GUID' };
        }
        const options = { guid, x, y };
        const unit = type === 'bmp' ? new BMP(options) : new Soldier(options);
        this.army.units.push(unit);
        console.log('Юнит создан:', unit.get());
        console.log('Армия:', this.army.units);
        return { ok: true, data: unit.get() };
    }

    /**
     * mediator.get(GET_ALL_UNITS)
     * @returns {{ ok: true, data: object[] }}
     */
    getAllUnits() {
        return { ok: true, data: this.army.getAllUnits() };
    }

    destructor() {
        this.army.destructor();
    }
}

module.exports = ArmyManager;
