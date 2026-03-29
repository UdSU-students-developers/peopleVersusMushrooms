const Unit = require("./Unit");

class Soldier extends Unit {
    constructor(options) {
        super(options);
        const { HP, SPEED, RANGE, VISIBLE } = options.stats;
        this.hp = HP;
        this.speed = SPEED;
        this.range = RANGE;
        this.visible = VISIBLE;
    }

}

module.exports = Soldier;