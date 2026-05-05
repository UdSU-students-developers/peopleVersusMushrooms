const GLOBAL_CONFIG = require('../../../../../../global/globalConfig');

class Map {
    constructor() {
        this.resources = null, // массив известных ресурсов [{x, y, value}]
        this.relief = this._initEmptyMap()
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

    /*
    buildGridFromRelief() {
        if (!this.relief) return;

        this.map = this.relief.map(row =>
            row.map(tile => {
                if (tile === null) return 3;
                return tile;
            })
        );

        const allUnits = [
            ...this.units.workers,
            ...this.units.larvae
        ];

        allUnits.forEach(u => u.setMap(this.map));
    } */
}

module.exports = Map;