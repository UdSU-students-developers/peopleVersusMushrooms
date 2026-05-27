const CONFIG = require('../../../../config');
const Building = require('../Building');

class Driller extends Building {
    constructor({ 
        guid, x, y, callbacks = {}
    })  {
        super({
            guid,
            x,
            y,
            callbacks,
            ...CONFIG.ECONOMY.BUILDINGS.DRILLER
        });
    }

    consume() {
        super.consume(CONFIG.ECONOMY.RESOURSES.ENERGY);
    }

    produce() {
        super.produce(CONFIG.ECONOMY.RESOURSES.OIL);
    }

    update() {
        // Потратить энергию
        this.consume();
        // Произвести нефть
        this.produce();
    }
}

module.exports = Driller;