const Unit = require("./Unit");
const CONFIG = require("../../../../config");

const { HP, SPEED, TYPE, VISIBILITY  } = CONFIG.ECONOMY.WORKER;

class Worker extends Unit {
    constructor(options) {
        super({
            ...options,
            type: TYPE,
            visibility: VISIBILITY
        });

        this.hp = HP;
        this.speed = SPEED;
    }

    get() {
        return {
            ...super.get(),
            hp: this.hp,
            speed: this.speed
        };
    }
}

module.exports = Worker;