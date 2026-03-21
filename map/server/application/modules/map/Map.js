const CONFIG = require('../../../config');
const Field = require('./entities/Field');
const MAP_CONFIG = require('./MapConfig');
const libnoise = require('libnoise').libnoise;

class Map {
    constructor(guid, width = 50, height = 50) {
        this.guid = guid; // это guid лобби (комнаты)
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
        this.fields = [];
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
    generateFields(iron, oil) {
        this.iron = typeof iron === "number" ? iron : MAP_CONFIG.DEFAULTS.IRON;
        this.oil = typeof oil === "number" ? oil : MAP_CONFIG.DEFAULTS.OIL;
        const mapSize = this.width * this.height;
        const ironSize = Math.floor(mapSize * iron / 100);
        const oilSize = Math.floor(mapSize * oil / 100);
        const positionsSize = ironSize + oilSize;
        const positions = new Set();

        while (positions.size < positionsSize) {
            const pos = Math.floor(Math.random() * mapSize);
            positions.add(pos);
        }

        positions.forEach(pos => {
            const row = Math.floor(pos / this.width);
            const col = pos % this.width;
            this.fields.push(new Field({ col, row, type: CONFIG.FIELD_NAMES.IRON }));
        });
    }

    get() {
        return {
            map: this.map,
            water: this.water,
            mountains: this.mountains,
            seed: this.seed,
            iron: this.iron,
            oil: this.oil,
            buildings: this.buildings.map(building => building),
            units: this.buildings.map(unit => unit),
            fields: this.fields.map(field => field),
        };
    }

    getEasy() {
        return {
            buildings: this.buildings.map(building => building),
            units: this.buildings.map(unit => unit),
            fields: this.fields.map(field => field)
        }
    }

    getGen() {
        return {
            water: this.water,
            mountains: this.mountains,
            seed: this.seed
        };
    }

    getTile(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return null;
        const data = {
            units: [],
            buildings: [],
            fields: []
        };
        this.units.forEach(unit => {
            if (unit.x === x && unit.y === y) {
                data.units.append(unit.get());
            }
        });
        this.buildings.forEach(building => {
            if ((building.x === x || building.x + width === x) &&
                (building.y === y || building.y + length === x)) {
                data.buildings.append(building.get());
            }
        });
        this.fields.forEach(field => {
            if (field.x === x && field.y === y) {
                data.fields.append(field.get());
            }
        });
        return this.map[y][x];
    }
}

module.exports = Map;