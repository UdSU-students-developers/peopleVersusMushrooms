const Entity = require("./Entity");

class Building extends Entity {
    constructor({ x, y, type, guid, length = 1, width = 1 }) {
        super({ x, y, type });
        
        this.guid = guid;
        this.length = length;
        this.width = width;
    }

    get() {
        const sup = super.get();
        return {
            ...sup,
            guid: this.guid,
            length: this.length,
            width: this.width
        };
    }
}

module.exports = Building;