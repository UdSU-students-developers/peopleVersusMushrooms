const Building = require('./Building');

class SmallGenerator extends Building {
    constructor({ guid, x, y, callbacks = {} }) {
        super({
            type: 'smallGenerator',
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

module.exports = SmallGenerator;