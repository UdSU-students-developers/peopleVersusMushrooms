const CONFIG = require('../../../../config');
const Building = require('../Building');

class Barracks extends Building {
    constructor({ guid, x, y, callbacks = {} }) {
        super({
            guid,
            x,
            y,
            callbacks,
            ...CONFIG.ECONOMY.BUILDINGS.BARRACKS
        });
        this.priority = 3;
    }
 
    consume() {
        super.consume(CONFIG.ECONOMY.RESOURSES.ENERGY);
    }

    produce(units) {

        // СДЕЛАТЬ ХОТЬ КАКУЮ-ТО ЛОГИКУ НАДО
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