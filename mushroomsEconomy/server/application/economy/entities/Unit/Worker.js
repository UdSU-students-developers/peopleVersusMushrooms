const Unit = require("./Unit");

class Worker extends Unit {
    constructor(options) {
        super(options);

        this.options = options.options;

        this.hp = this.options.hp;
        this.speed = this.options.speed;
    }
}

module.exports = Worker;