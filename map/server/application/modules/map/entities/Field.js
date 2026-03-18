const Entity = require("./Entity");

class Field extends Entity {
    constructor({ x, y, type }) {
        super({ x, y, type });
    }
}

module.exports = Field;