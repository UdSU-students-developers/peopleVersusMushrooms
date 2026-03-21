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
    }

    /**
     * mediator.get(SET_UNIT_TARGET, { guid, targetX, targetY }) — alias: unitGuid, x, y
     * @returns {{ ok: true } | { ok: false, error: string }}
     */
    setUnitTarget(data) {
        const guid = data?.guid ?? data?.unitGuid;
        const tx = data?.targetX ?? data?.x;
        const ty = data?.targetY ?? data?.y;
        if (guid === undefined || guid === null || tx === undefined || ty === null) {
            return { ok: false, error: 'BAD_PAYLOAD' };
        }
        const unit = this.army.units.find((u) => String(u.guid) === String(guid));
        if (!unit) {
            return { ok: false, error: 'UNIT_NOT_FOUND' };
        }
        unit.setTarget(Number(tx), Number(ty));
        return { ok: true };
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
        if (guid === undefined || guid === null || data?.x === undefined || data?.y === undefined) {
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
        return { ok: true, data: unit.get() };
    }

    destructor() {
        this.army.destructor();
    }
}

module.exports = ArmyManager;
