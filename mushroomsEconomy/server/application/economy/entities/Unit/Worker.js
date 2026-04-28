const Unit = require("./Unit");
const CONFIG = require("../../../../config");

const { HP, SPEED } = CONFIG.ECONOMY.WORKER;

class Worker extends Unit {
    constructor(options) {
        super(options);

        this.hp = HP;
        this.speed = SPEED;
    }
}

module.exports = Worker;