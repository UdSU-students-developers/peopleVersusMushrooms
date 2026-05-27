const CONFIG = require('../../../../config');
const Building = require('../Building');

class Pipe extends Building {
    constructor({ guid, x, y, callbacks = {} }) {
        super({
            guid,
            x,
            y,
            callbacks,
            ...CONFIG.ECONOMY.BUILDINGS.PIPE
        });
        this.is_walkable = true;
    }
    
}

module.exports = Pipe;