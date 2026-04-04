const BaseManager = require('../BaseManager');

class MapManager extends BaseManager {
    constructor(options) {
        super(options);
        this.map = null;
    }

    generate(width = 50, height = 50) {
        this.map = [];

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                let tile = 0;

                const rand = Math.random();
                
                if (rand > 0.95) {
                    tile = 2; 
                } else if (rand > 0.90) {
                    tile = 1;
                }

                row.push(tile);
            }
            this.map.push(row);
        }

        console.log(`[MapManager] Карта ${width}x${height} сгенерирована.`);
        return this.map;
    }

    get() {
        return this.map;
    }
}

module.exports = MapManager;
