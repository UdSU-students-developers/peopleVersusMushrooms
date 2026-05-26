const CONFIG = require("../../../../../config");
const Reactor = require("./Reactor");

class SmallReactor extends Reactor {
    constructor({ guid, x, y, callbacks }) {
        super({
            guid,
            x,
            y,
            callbacks,
            ...CONFIG.ECONOMY.BUILDINGS.SMALL_REACTOR
        });
    }
}

module.exports = SmallReactor;