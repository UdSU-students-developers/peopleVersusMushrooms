const GLOBAL_CONFIG = require('../../../../../../global/globalConfig');

class Map {
    constructor() {
        this.resources = null;
        this.relief = this._initEmptyMap();

        this.myceliumGrid = null;
        this.larvaGrid = null; 
    }

    get() {
        return {
            resources: this.resources,
            relief: this.relief,
        };
    }

    setResources(resources) {
        this.resources = resources;
    }

    setRelief(relief) {
        this.relief = relief;
    }


    updateLarvaGrid(buildings) {
        if (!this.relief?.length) return;

        const rows = this.relief.length;
        const cols = this.relief[0].length;

        if (!this.larvaGrid) {
            this.larvaGrid = Array.from({ length: rows }, () => Array(cols).fill(0));
        } else {
            for (let y = 0; y < rows; y++) {
                this.larvaGrid[y].fill(0);
            }
        }

        const blockingBuildings = [
            ...(buildings.smallReactors || []),
            ...(buildings.incubators || []),
        ];

        for (const building of blockingBuildings) {
            const { x, y } = building;
            if (x >= 0 && x < cols && y >= 0 && y < rows) {
                this.larvaGrid[y][x] = 1;
            }
        }
    }

    updateMyceliumGrid(myceliumList) {
        const { MAP_SIZE } = GLOBAL_CONFIG;

        if (!this.myceliumGrid) {
            this.myceliumGrid = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(0));
        } else {
            for (let y = 0; y < MAP_SIZE; y++) {
                this.myceliumGrid[y].fill(0);
            }
        }

        for (const mc of myceliumList) {
            const { x, y } = mc;
            if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) {
                this.myceliumGrid[y][x] = 1;
            }
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
}

module.exports = Map;