const GLOBAL_CONFIG = require('../../../../../../global/globalConfig');

class Resource {
    constructor(x, y, type, saturation) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.saturation = saturation;
    }

    get() {
        return {
            x: this.x,
            y: this.y,
            type: this.type,
            saturation: this.saturation,
        }
    }
}

module.exports = Resource;