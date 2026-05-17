const SmallReactor = require('./SmallReactor');

class Reactor extends SmallReactor {
    constructor(options) {
        super({
            ...options,
            type: TYPE, 
            hp: HP, 
            size: SIZE, 
            consumption: CONSUMPTION, 
            production: PRODUCTION, 
            capacity: CAPACITY,
            visibility: VISIBILITY,
        })
    }

    
}