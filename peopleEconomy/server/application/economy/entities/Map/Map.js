const GLOBAL_CONFIG = require('../../../../../../global/globalConfig');

const Resource = require('./Resource');

class Map {
    constructor() {
        this.resources = this._initEmptyMap(null);
        this.relief = this._initEmptyMap(null);

        this.buildingsGrid = this._initEmptyMap(0);
        this.unitsGrid = this._initEmptyMap(0);
    }

    get() {
        return {
            resources: this.resources,
            relief: this.relief,
        };
    }

    setResources(resources) {
        for (const res of resources) {
            if (this.resources[res.y][res.x] != null) continue;
            this.resources[res.y][res.x] = new Resource(
                res.x,
                res.y,
                res.type,
                res.saturation,
            );
        }
    }

    setRelief(relief) {
        this.relief = relief;
        for (let i = 0; i < 100; i++) {
            for (let j = 0; j < 100; j++) {
                if (this.relief[i][j] === 2) {
                    this.unitsGrid[i][j] = 1;
                }
            }
        }
    }

    setBuilding(building) {
        const { x, y, size } = building;
        for (let i = x; i < x + size; i++) {
            for (let j = 0; j < y + size; j++) {
                this.buildingsGrid[i][j] = 1;
                if (!building.is_walkable) {
                    this.unitsGrid[i][j] = 1;
                }
            }
        }
    }

    setUnit(unit) {
        const { x, y } = unit;
        this.unitsGrid[x][y] = 1;
    }

    _initEmptyMap(value) {
        return Array.from({ length: 100 }, () => Array(100).fill(value));
    }

}

module.exports = Map;