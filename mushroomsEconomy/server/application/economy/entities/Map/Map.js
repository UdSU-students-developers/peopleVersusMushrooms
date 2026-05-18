const GLOBAL_CONFIG = require('../../../../../../global/globalConfig');

const Resource = require('./Resource');

class Map {
    constructor() {
        this.resources = this._initEmptyMap();
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
        for(const res of resources) {
            if (this.resources[res.y][res.x] != null) continue;
            this.resources[res.y][res.x] = new Resource(
                res.x,
                res.y,
                res.type,
                res.saturation,
            );
        }
        console.log(resources);
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
            ...(buildings.reactors || []),
            ...(buildings.incubators || []),
        ];

        for (const building of blockingBuildings) {
            const size = building.size ?? 1;
            for (let dy = 0; dy < size; dy++) {
                for (let dx = 0; dx < size; dx++) {
                    const bx = building.x + dx;
                    const by = building.y + dy;
                    if (bx >= 0 && bx < cols && by >= 0 && by < rows) {
                        this.larvaGrid[by][bx] = 1;
                    }
                }
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