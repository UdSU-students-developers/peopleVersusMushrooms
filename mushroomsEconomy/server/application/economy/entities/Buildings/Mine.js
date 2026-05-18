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

        this.resources = {
            iron: 0,
            fat: 0,
        };
    }

    get() {
        return {
            ...super.get(),
            resources: { ...this.resources },
        };
    }

    update() {
        if (!this.callbacks.getResources) return;

        const resources = this.callbacks.getResources();
        if (!resources || !resources[this.y]) return;

        const res = resources[this.y][this.x];
        if (res && res.type === 'IRON') {
            this.resources.iron += res.saturation;
        }
    }
}

module.exports = Mine;