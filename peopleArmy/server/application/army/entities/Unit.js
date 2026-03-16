class Unit {
    constructor({ guid, x, y }) {
        this.guid = guid;
        this.x = x;
        this.y = y;

        this.hp = 1; // здоровье юнита
        this.speed = 1; // скорость юнита
        this.range = 2; // дальность стрельбы
        this.visible = 3; // дальность видимости
    }

    get() {
        return {
            guid: this.guid,
            x: this.x,
            y: this.y,
            hp: this.hp,
            speed: this.speed,
            range: this.range,
            visible: this.visible
        }
    }

    move(map) {

    }
}

module.exports = Unit;