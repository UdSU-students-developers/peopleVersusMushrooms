const Unit = require("./Unit");

class Building extends Unit {
    constructor({ x, y, type, guid, role, size = 1, visibility = 1 }) {
        super({ x, y, type, guid, role, visibility });
        this.size = size;
    }

    get() {
        return {
            ...super.get(),
            size: this.size,
        };
    }

    getSelf() {
        return {
            ...super.getSelf(),
            size: this.size,
        };
    }

    getPos() {
        return {
            x: [this.x, this.x + this.size - 1],
            y: [this.y, this.y + this.size - 1]
        }
    }

    getVisibleRange() {
        return {
            x: [this.x - this.visibility, this.x + this.visibility + this.size - 1],
            y: [this.y - this.visibility, this.y + this.visibility + this.size - 1],
        }
    }
}

module.exports = Building;