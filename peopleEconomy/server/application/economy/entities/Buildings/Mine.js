const CONFIG = require('../../../../config');
const Building = require('../Building');

class Mine extends Building {
    constructor({ 
        guid, x, y, callbacks = {}
    })  {
        super({
            guid,
            x,
            y,
            callbacks,
            ...CONFIG.ECONOMY.BUILDINGS.MINE
        });
    }

    consume() {
        super.consume(CONFIG.ECONOMY.RESOURSES.ENERGY);
    }

    produce() {
        super.produce(CONFIG.ECONOMY.RESOURSES.IRON);
    }

    update() {
        // Потратить энергию
        this.consume();
        // Произвести железо
        this.produce();
    }
}

module.exports = Mine;