const CONFIG = require('../../../../../config');
const Building = require('../../Building');

class Reactor extends Building {
    constructor({ 
        guid, x, y, callbacks = {}, type, hp, visibility, priority,
        size = null, consumption = null, capacity = null, production = null 
    })  {
        super({
            type,
            guid,
            x,
            y,
            visibility,
            size,
            callbacks,
            hp,
            consumption,
            capacity,
            production,
            priority
        });
    }

    consume() {
        super.consume(CONFIG.ECONOMY.RESOURSES.OIL);
    }

    produce() {
        super.produce(CONFIG.ECONOMY.RESOURSES.ENERGY);
    }

    update() {
        // Потратить нефть
        this.consume();
        // Произвести энергию
        this.produce();
    }
}

module.exports = Reactor;