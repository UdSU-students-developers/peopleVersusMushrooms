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
        this.inertia = 0;
        this.priority = 3;
    }

    consume() {
        super.consume(CONFIG.ECONOMY.RESOURSES.ENERGY);
        this.inertia++;
    }

    produce(units) {
        if (this.inertia > 1000) {
            this.callbacks.createUnit({
                x: this.x + this.size,
                y: this.y + this.size,
                type: 'soldier'
            });
            this.inertia = 0;
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