const Entity = require("./Entity");

class Source extends Entity {
    constructor({ x, y, type, saturation }) {
        super({ x, y, type });

        this.saturation = saturation;
    }

    get() {
        return {
            ...super.get(),
            saturation: this.saturation
        }
    }
}

module.exports = Source;