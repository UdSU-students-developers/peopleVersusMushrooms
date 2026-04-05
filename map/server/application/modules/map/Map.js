const CONFIG = require('../../../config');
const MAP_CONFIG = require('./MapConfig');

const libnoise = require('libnoise').libnoise;

const Source = require('./entities/Source');

class Map {
    constructor(guid, width = 50, height = 50) {
        this.guid = guid; // guid создателя лобби
        this.map = [];
        this.width = width;
        this.height = height;
        for (let i = 0; i < height; i++) {
            this.map.push(new Array(width));
        }
        // Поля генерации
        this.water = null;
        this.mountains = null;
        this.seed = null;
        this.iron = null;
        this.oil = null;
        // Массивы объектов на карте
        this.buildings = [];
        this.units = [];
        this.sources = [];
    }

    // сгенерировать карту
    // water, mountains - [0-100]
    // seed - number
    generateRelief(water, mountains, seed) {
        this.water = typeof water === "number" ? water : MAP_CONFIG.DEFAULTS.WATER;
        this.mountains = typeof mountains === "number" ? mountains : MAP_CONFIG.DEFAULTS.MOUNTAIN;
        this.seed = typeof seed === "number" ? seed : MAP_CONFIG.DEFAULTS.SEED;

        //val -> [0,100]
        const clamp = val => val < 0 ? 0 : (val > 100 ? 100 : val);
        this.water = clamp(this.water);
        this.mountains = clamp(this.mountains);

        //adjust levels
        const scale = (val, min, max) => val * (max - min) / 100.0 + min;
        const level1 = scale(this.water, -1.0, -0.6);
        const level2 = scale(this.mountains, 0, 1);

        //var noise = new libnoise.generator.Perlin(.01, 2.0, 0.5, 8, 42, libnoise.QualityMode.MEDIUM);
        //var noise = new libnoise.generator.Perlin(.01, 2.0, 0.5, this.water, this.bush, libnoise.QualityMode.MEDIUM);
        const g1 = new libnoise.generator.Billow(2, 2, 0.5, 6, this.seed, libnoise.QualityMode.MEDIUM); //frequency, lacunarity, persistence, octaves, seed, quality
        const g2 = new libnoise.generator.RidgedMultifractal(1, 2, 6, this.seed, libnoise.QualityMode.MEDIUM); //frequency, lacunarity, octaves, seed, quality
        const g3 = new libnoise.generator.Perlin(0.5, 2, 0.25, 6, this.seed, libnoise.QualityMode.MEDIUM); //frequency, lacunarity, persistence, octaves, seed, quality
        const o1 = new libnoise.operator.ScaleBias(0.125, -0.75, g1); //scale, bias, input
        const o2 = new libnoise.operator.Select(0, 1000, 0.125, o1, g2, g3); //min, max, falloff, primary, secondary, controller
        const o3 = new libnoise.operator.Turbulence(0.125, o2); //power, input, distortX, distortY, distortZ
        const o4 = new libnoise.operator.Scale(0.07, 0.07, 1.0, o3); //sx, sy, sz, input

        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                const val = o4.getValue(j, i, 0);
                let tile = MAP_CONFIG.TILES.WATER; // Вода
                if (val > level1) tile = MAP_CONFIG.TILES.PLANE;  // Равнина
                if (val > level2) tile = MAP_CONFIG.TILES.MOUNTAIN;  // Горы
                this.map[i][j] = tile;
            }
        }
    }

    // iron, oil - [0, 20]
    generateSources(iron, oil) {
        this.iron = typeof iron === "number" ? iron : MAP_CONFIG.DEFAULTS.IRON;
        this.oil = typeof oil === "number" ? oil : MAP_CONFIG.DEFAULTS.OIL;
        const mapSize = this.width * this.height;
        const ironSize = Math.floor(mapSize * iron / 100);
        const oilSize = Math.floor(mapSize * oil / 100);
        const positions = new Set();
        
        while (positions.size < ironSize + oilSize) {
            const pos = Math.floor(Math.random() * mapSize);
            positions.add(pos);
        }

        let c = 0
        positions.forEach(pos => {
            const row = Math.floor(pos / this.width);
            const col = pos % this.width;
            this.sources.push(
                (c > ironSize) ?
                    new Source({ col, row, type: CONFIG.FIELD_NAMES.IRON, saturation: MAP_CONFIG.SATURATION.IRON }) :
                    new Source({ col, row, type: CONFIG.FIELD_NAMES.OIL, saturation: MAP_CONFIG.SATURATION.OIL })
            );
            c++;
        });
    }

    get() {
        return {
            buildings: this.buildings.map(building => building),
            units: this.buildings.map(unit => unit),
            sources: this.sources.map(source => source)
        };
    }

    getSelf() {
        return {
            map: this.map.map(row => row.map(tile => tile)),
            buildings: this.buildings.map(building => building),
            units: this.buildings.map(unit => unit),
            sources: this.sources.map(source => source)
        };
    }

    getGen() {
        return {
            water: this.water,
            mountains: this.mountains,
            seed: this.seed,
            iron: this.iron,
            oil: this.oil
        };
    }

    getTile(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return null;
        const data = {
            units: [],
            buildings: []
        };
        this.units.forEach(unit => {
            if (unit.x === x && unit.y === y) {
                data.units.append(unit.get());
            }
        });
        this.buildings.forEach(building => {
            if (building.x <= x && building.x + building.size >= x &&
                building.y <= y && building.y + building.size >= y) {
                data.buildings.append(building.get());
            }
        });
        return {
            relief: this.map[y][x],
            data
        };
    }

    getSourcesTile(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return null;
        const data = {
            sources: []
        };
        this.sources.forEach(sources => {
            if (sources.x === x && sources.y === y) {
                data.sources.append(sources.get());
            }
        });
        return {
            relief: this.map[y][x],
            data
        };
    }

    //visibility - массив из пар чисел/координат на карте
    getTilesByVisibility(visibility) {
        return visibility.map(tile => {
                return {
                    x: tile[0],
                    y: tile[1],
                    ...this.getTile(tile[0], tile[1]),
                }
            }
        );
    }

    getTilesBySourcesVisibility(visibility) {
        return visibility.map(tile => {
                return {
                    x: tile[0],
                    y: tile[1],
                    ...this.getSourcesTile(tile[0], tile[1]),
                }
            }
        );
    }
}

module.exports = Map;