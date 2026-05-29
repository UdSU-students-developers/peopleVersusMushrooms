const CONFIG = require("../../../../../config");
const Reactor = require("./Reactor");

class LargeReactor extends Reactor {
    constructor({ guid, x, y, callbacks }) {
        super({
            guid,
            x,
            y,
            callbacks,
            ...CONFIG.ECONOMY.BUILDINGS.LARGE_REACTOR
        });
    }
}

module.exports = LargeReactor;