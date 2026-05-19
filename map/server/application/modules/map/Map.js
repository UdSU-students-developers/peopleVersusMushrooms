const { randomInt } = require('crypto');
const libnoise = require('libnoise').libnoise;

const CONFIG = require('../../../config');
const MAP_CONFIG = require('./MapConfig');

const Source = require('./entities/Source');
const Unit = require('./entities/Unit');
const Building = require('./entities/Building');

class Map {
    constructor({ guid, playerGuids, width = 100, height = 100 }) {
        this.guid = guid; // guid создателя лобби
        this.map = [];
        this.playerGuids = { // guid-ы игроков
            spectator: playerGuids.spectator,
            peopleArmy: playerGuids.peopleArmy,
            peopleEconomy: playerGuids.peopleEconomy,
            mushroomArmy: playerGuids.mushroomArmy,
            mushroomEconomy: playerGuids.mushroomEconomy,
        }
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

    get() {
        return {
            buildings: this.buildings.map(building => building),
            units: this.units.map(unit => unit),
        };
    }

    getGuids() {
        return {
            mapGuid: this.guid,
            ...this.playerGuids,
        }
    }

    getRelief() {
        return this.map.map(row => row.map(tile => tile));
    }

    getSelf() {
        return {
            map: this.getRelief(),
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

    // ============ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ============

    getVisibleEntities(searchedEntities, searchingEntities) {
        const visibleEntities = [];
        for (const entity of searchedEntities) {
            const pos = entity.getPos();
            for (const searchingEntity of searchingEntities) {
                const vis = searchingEntity.getVisibleRange();
                if ((
                    vis.x[0] <= pos.x[0] && pos.x[0] <= vis.x[1] ||
                    vis.x[0] <= pos.x[1] && pos.x[1] <= vis.x[1]
                ) && (
                        vis.y[0] <= pos.y[0] && pos.y[0] <= vis.y[1] ||
                        vis.y[0] <= pos.y[1] && pos.y[1] <= vis.y[1]
                    )
                ) {
                    visibleEntities.push(entity);
                    break;
                }
            }
        }
        return visibleEntities;
    }

    // ============ ЛОГИКА ============

    getVisbileEntitiesByRole(role) {
        const units = [];
        const buildings = [];
        const roleEntities = [];
        const notRoleEntities = [];
        [...this.units, ...this.buildings].forEach(entity => {
            if (entity.role === role) {
                roleEntities.push(entity);
            } else {
                notRoleEntities.push(entity);
            }
        });
        const visibleEntities = this.getVisibleEntities(notRoleEntities, roleEntities);
        visibleEntities.forEach(entity => {
            if (entity instanceof Unit) {
                units.push(entity.get());
            } else {
                buildings.push(entity.get());
            }
        });
        return { units, buildings };
    }

    getVisbileSourcesByRole(role) {
        const roleEntities = [];
        this.units.forEach(unit => {
            if (unit.role === role) {
            //if (unit.role === role && ['mushroomWorker', 'humanWorker'].includes(unit.type)) {
                roleEntities.push(unit);
            }
        });
        const sources = this.getVisibleEntities(this.sources, roleEntities).map(source => source.get());
        return { sources };
    }

    updateUnit(unit) {
        // ищем юнита по гуиду
        const unitIndex = this.units.findIndex(elem => unit.guid === elem.guid);
        if (unitIndex + 1) {
            const unitInArray = this.units[unitIndex]
            // если нашелся и не изменился - считаем убитым
            if (unit.x === unitInArray.x && unit.y === unitInArray.y) {
                this.units.splice(unitIndex, 1);
            } else {
                // если нашелся и изменился - передвинулся
                unitInArray.x = unit.x;
                unitInArray.y = unit.y;
            }
        } else {
            // не нашли - добавляем
            this.units.push(
                new Unit(unit)
            );
        }
    }

    updateBuilding(building) {
        // ищем юнита по гуиду
        const buildingIndex = this.buildings.findIndex(elem => building.guid === elem.guid);
        if (buildingIndex + 1) {
            // если нашлось - удаляем
            this.buildings.splice(buildingIndex, 1);
        } else {
            // не нашли - добавляем
            this.buildings.push(
                new Building(building)
            );
        }
    }

    // сгенерировать карту
    // water, mountains - [0-100]
    // seed - number
    generateRelief() {
        this.water = MAP_CONFIG.DEFAULTS.WATER;
        this.mountains = MAP_CONFIG.DEFAULTS.MOUNTAIN;
        this.seed = randomInt(2 ** 48 - 1);

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
    generateSources() {
        this.iron = MAP_CONFIG.DEFAULTS.IRON;
        this.oil = MAP_CONFIG.DEFAULTS.OIL;
        const clamp = val => val < 0 ? 0 : (val > 20 ? 20 : val);
        this.iron = clamp(this.iron);
        this.oil = clamp(this.oil);
        const mapSize = this.width * this.height;
        const ironSize = Math.floor(mapSize * this.iron / 100);
        const oilSize = Math.floor(mapSize * this.oil / 100);
        const positions = new Set();

        while (positions.size < ironSize + oilSize) {
            const pos = Math.floor(Math.random() * mapSize);
            positions.add(pos);
        }

        [...positions].forEach((pos, index) => {
            const y = Math.floor(pos / this.width);
            const x = pos % this.width;
            this.sources.push(
                (index > ironSize) ?
                    new Source({ x, y, type: CONFIG.FIELD_NAMES.IRON, saturation: MAP_CONFIG.SATURATION.IRON }) :
                    new Source({ x, y, type: CONFIG.FIELD_NAMES.OIL, saturation: MAP_CONFIG.SATURATION.OIL })
            );
        });
    }

    generateStartingPositions() {
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                this.map[i][j] = 0;
                this.map[99 - i][99 - j] = 0;
            }
        }
    }
}

module.exports = Map;