const Building = require('./Building');

class Mine extends Building {
    constructor({ guid, x, y, callbacks = {} }) {
        super({
            type: 'mine',
            guid,
            x,
            y,
            callbacks,
            hp: 100,
            size: 2,
        });
    }

    get() {
        return {
            ...super.get()
        };
    }
}

module.exports = Mine;