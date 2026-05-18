const Building = require('./Building');
const CONFIG = require('../../../../config');

const { TYPE, HP, SIZE, CONSUMPTION, PRODUCTION, CAPACITY, VISIBILITY } = CONFIG.ECONOMY.MINE;

class Mine extends Building {
    constructor({ guid, x, y, callbacks = {} }) {
        super({
            guid,
            x,
            y,
            callbacks,
            type: TYPE,
            hp: HP,
            size: SIZE,
            consumption: CONSUMPTION,
            production: PRODUCTION,
            capacity: CAPACITY,
            visibility: VISIBILITY,
        });
    }

    get() {
        return {
            ...super.get(),
        };
    }

    extractIron() {
        if (!this.callbacks.getResources) return 0;

        const resources = this.callbacks.getResources();
        if (!resources || !resources[this.y]) return 0;

        const res = resources[this.y][this.x];
        if (res && res.type === 'IRON') {
            return res.saturation;
        }

        return 0;
    }
}

module.exports = Mine;