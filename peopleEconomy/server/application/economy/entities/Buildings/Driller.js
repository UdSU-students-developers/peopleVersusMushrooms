const Building = require('./Building');

class Driller extends Building {
    constructor({ guid, x, y, callbacks = {} }) {
        super({
            type: 'driller',
            guid,
            x,
            y,
            callbacks,
            hp: 100,
            size: 1,
        });
    }

    get() {
        return {
            ...super.get()
        };
    }
}

module.exports = Driller;