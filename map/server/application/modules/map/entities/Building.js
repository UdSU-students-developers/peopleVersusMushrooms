const Entity = require("./Entity");

class Building extends Entity {
    constructor({ x, y, type, guid, size = 1 }) {
        super({ x, y, type });

        this.guid = guid;
        this.size = size;
    }

    get() {
        return {
            ...super.get(),
            guid: this.guid,
            size: this.size
        };
    }
}

module.exports = Building;