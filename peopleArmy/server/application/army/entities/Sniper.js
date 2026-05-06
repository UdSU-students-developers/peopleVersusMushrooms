const Unit = require("./Unit");

class Sniper extends Unit {
    constructor(options) {
        super(options);
        this.hp = options.HP;
        this.speed = options.SPEED;
        this.range = options.RANGE;
        this.visible = options.VISIBLE;
    }
}

module.exports = Sniper;
