const Building = require('./Building');

class Pipe extends Building {
    constructor({ guid, x, y,  callbacks = {} }) {
        super({
            type: 'pipe',
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

module.exports = Pipe;