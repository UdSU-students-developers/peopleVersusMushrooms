const Unit = require("./Unit");

class Worker extends Unit {
    constructor(options) {
        super(options);

        this.hp = options.params.hp;
        this.speed = options.params.speed;
    }
}

module.exports = Worker;