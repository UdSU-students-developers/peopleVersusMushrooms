const Entity = require("./Entity");

class Unit extends Entity {
    constructor({ x, y, type, guid }) {
        super({ x, y, type });
        this.guid = guid;
    }
    
    get() {
        return {
            ...super.get(),
            guid: guid
        };
    }
}

module.exports = Unit;