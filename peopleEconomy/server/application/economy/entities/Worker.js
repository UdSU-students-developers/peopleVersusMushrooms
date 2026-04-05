const { WORKER_HP, WORKER_SPEED } = require("../../../config");
const Unit = require("./Unit");


class Worker extends Unit {
    constructor(options) {
        super(options);

        this.hp = WORKER_HP;
        this.speed = WORKER_SPEED;
    }

    get() {
        return {
            guid: this.guid,
            x: this.x,
            y: this.y,
            hp: this.hp,   
        };
    }

    //поиск ресурса
    searchResource(newX, newY, resource) {

    }

    //построить здание
    createBuilding(x, y, type) {

    }
}

module.exports = Worker;