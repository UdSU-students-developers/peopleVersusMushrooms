const Entity = require("./Entity");

class Unit extends Entity {
    constructor({ x, y, type, guid }) {
        super({ x, y, type });
        this.guid = guid;
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    get() {
        const sup = super.get();
        return {
            ...sup,
            guid: guid
        };
    }
}

module.exports = Unit;