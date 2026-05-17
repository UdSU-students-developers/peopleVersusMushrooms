const SmallReactor = require('./SmallReactor');
const CONFIG = require('../../../../config');

const {
    TYPE,
    HP,
    SIZE,
    CONSUMPTION,
    PRODUCTION,
    CAPACITY,
    VISIBILITY,
    CONSUME_RADIUS,
} = CONFIG.ECONOMY.BIO_REACTOR;

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
        });

        this.consumeRadius = CONSUME_RADIUS;
    }
}

module.exports = Reactor;