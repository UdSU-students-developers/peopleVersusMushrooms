const Building = require('./Building');

class Barracks extends Building {
    constructor({ guid, x, y, callbacks = {} }) {
        super({
            type: 'barracks',
            guid,
            x,
            y,
            callbacks,
            hp: 200,
            size: 2,
            consumption: 5,      
            production: 0,      
            capacity: 100  
        });
    }
    
    get() {
        return {
            ...super.get(),
            //....
        };
    }
    
    getSelf() {
        return {
            ...super.getSelf(),
            //....
        };
    }
    
}

module.exports = Barracks;