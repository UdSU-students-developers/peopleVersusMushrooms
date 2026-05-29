const GLOBAL_CONFIG = require('../../../../../../global/globalConfig');
const CONFIG = require('../../../../config');
const Building = require('../Building');

const {
    BMP,
    SNIPER,
    PARTIZAN,
    SOLDIER,
    WORKER
} = CONFIG.ECONOMY.UNITS;

class Barracks extends Building {
    constructor({ guid, x, y, callbacks = {} }) {
        super({
            guid,
            x,
            y,
            callbacks,
            ...CONFIG.ECONOMY.BUILDINGS.BARRACKS
        });
        this.inertia = 0;
    }

    check(UNIT) {
        return this.inertia > UNIT.INERTIA && this.store.IRON >= UNIT.COST;
    }

    canMake(type) {
        const unitData = {
            x: this.x + this.size - 1,
            y: this.y + this.size,
            type
        };
        switch (type) {
            case BMP.TYPE:
                if (this.check(BMP)) {
                    this.callbacks.createUnit(unitData);
                    return BMP.COST;
                }
                break
            case SNIPER.TYPE:
                if (this.check(SNIPER)) {
                    this.callbacks.createUnit(unitData);
                    return SNIPER.COST;
                }
                break
            case PARTIZAN.TYPE:
                if (this.check(PARTIZAN)) {
                    this.callbacks.createUnit(unitData);
                    return PARTIZAN.COST;
                }
                break
            case SOLDIER.TYPE:
                if (this.check(SOLDIER)) {
                    this.callbacks.createUnit(unitData);
                    return SOLDIER.COST;
                }
                break
            case WORKER.TYPE:
                if (this.check(WORKER)) {
                    this.callbacks.createUnit(unitData);
                    return WORKER.COST;
                }
                break
        }
        return false;
    }

    consume() {
        super.consume(CONFIG.ECONOMY.RESOURSES.ENERGY);
        this.inertia++;
    }

    produce(units) {
        const plannedUnitType = units[0];
        const cost = this.canMake(plannedUnitType);
        if (cost) {
            units.splice(0, 1);
            this.store.IRON -= cost;
        }
        this.is_working = false;
        return;
    }

    update(units) {
        // Потратить энергию
        this.consume();
        // Произвести юнитов
        this.produce(units);
    }
}

module.exports = Barracks;