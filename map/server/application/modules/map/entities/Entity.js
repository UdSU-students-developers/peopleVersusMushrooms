class Entity {
    constructor({ x, y, type }) {
        this.x = x;
        this.y = y;
        this.type = type;
    }

    get() {
        return {
            x: this.x,
            y: this.y,
            type: this.type
        }
    }

    getPos() {
        return {
            x: [this.x, this.x],
            y: [this.y, this.y]
        }
    }
}

module.exports = Entity;