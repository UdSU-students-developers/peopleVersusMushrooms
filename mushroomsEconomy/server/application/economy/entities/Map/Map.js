const GLOBAL_CONFIG = require('../../../../../../global/globalConfig');

class Map {
    constructor() {
        this.resources = null, // массив известных ресурсов [{x, y, value}]
        this.relief = this._initEmptyMap()

        this.myceliumGrid = null; // сетка мицелия для проверки связей
        this.larvaGrid = null;    // сетка для передвижения личинок
    }

    get() {
        return {
            resources: this.resources,
            relief: this.relief,
        }
    }

    _initEmptyMap() {
        const { MAP_SIZE } = GLOBAL_CONFIG;
        const map = [];
        for (let i = 0; i < MAP_SIZE; i++) {
            map.push([]);
            for (let j = 0; j < MAP_SIZE; j++) {
                map[i].push(null);
            }
        }
        return map;
    }

    setResources(resources) {
        this.resources = resources;
    }

    setRelief(relief) {
        this.relief = relief;
        //this.buildGridFromRelief();
    }

    updateMyceliumGrid(mycelium) {
        const { MAP_SIZE } = GLOBAL_CONFIG;
        this.myceliumGrid = Array(MAP_SIZE).fill(null).map(() => Array(MAP_SIZE).fill(0));

        for (const mc of mycelium) {
            if (mc.x >= 0 && mc.x < MAP_SIZE && mc.y >= 0 && mc.y < MAP_SIZE) {
                this.myceliumGrid[mc.y][mc.x] = 1;
            }
        }
    }

    updateLarvaGrid(buildings) {
        if (!this.relief || !this.relief.length) return;

        const rows = this.relief.length;
        const cols = this.relief[0].length;

        this.larvaGrid = Array(rows).fill().map(() => Array(cols).fill(0));

        const allBuildings = [
            ...(buildings.smallReactors || []),
            ...(buildings.incubators || []),
        ];

        for (const building of allBuildings) {
            if (building.x >= 0 && building.x < cols && building.y >= 0 && building.y < rows) {
                this.larvaGrid[building.y][building.x] = 1;
            }
        }
    }
}

module.exports = Map;