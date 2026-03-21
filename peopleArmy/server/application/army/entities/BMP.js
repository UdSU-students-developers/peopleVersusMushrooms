const CONFIG = require("../../../config");
const Unit = require("./Unit");

const { HP, SPEED, RANGE, VISIBLE } = CONFIG.ARMY.BMP;

class BMP extends Unit {
    constructor(options) {
        super(options);
        this.hp = HP;
        this.speed = SPEED;
        this.range = RANGE;
        this.visible = VISIBLE;
    }

}

module.exports = BMP;