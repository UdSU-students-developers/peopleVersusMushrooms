const { HP, SPEED } = CONFIG.ECONOMY.WORKER;

class Worker {
    constructor({ x, y, guid, callbacks, easystar}) {
        this.x = x;
        this.y = y;
        this.guid = guid;
        this.callbacks = callbacks;
        this.hp = HP;
        this.speed = SPEED;
        this.easystar = easystar;

    }

    get() {
        return {
            x: this.x,
            y: this.y,
            hp: this.hp
        }
    }
}

module.exports = Worker;