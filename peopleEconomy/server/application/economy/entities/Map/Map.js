const GLOBAL_CONFIG = require('../../../../../../global/globalConfig');

const Resource = require('./Resource');

class Map {
    constructor() {
        this.resources = this._initEmptyMap();
        this.relief = this._initEmptyMap();

        this.buildingGrid = null;
        this.unitGrid = null; 
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
    }

    setRelief(relief) {
        this.relief = relief;
    }

    _initEmptyMap() {
        return Array.from({ length: 100 }, () => Array(100).fill(null));
    }

}

module.exports = Map;