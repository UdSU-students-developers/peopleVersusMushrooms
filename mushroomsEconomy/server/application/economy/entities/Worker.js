const Unit = require("./Unit");

const { HP, SPEED } = CONFIG.ECONOMY.WORKER;

class Worker extends Unit {
    constructor(options) {
        super(options);
    }
}

module.exports = Worker;