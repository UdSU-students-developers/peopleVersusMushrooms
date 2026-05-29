const CONFIG = require('../../../../../config');
const Building = require('../../Building');

class IronBarrel extends Building {
    constructor({ guid, x, y, callbacks = {} }) {
        super({
            guid,
            x,
            y,
            callbacks,
            ...CONFIG.ECONOMY.BUILDINGS.IRON_BARREL
        });
    }
}

module.exports = IronBarrel;