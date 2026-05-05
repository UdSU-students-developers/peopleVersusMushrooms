import GLOBAL_CONFIG from "../../../../../../global/globalConfig";

class Map {
    constructor() {
        this.map = {
            resources: null, // массив известных ресурсов [{x, y, value}]
            relief: this._initEmptyMap(),
        };
    }

    _initEmptyMap() {
        const map = [];
        for (let i = 0; i < GLOBAL_CONFIG.MAP_SIZE; i++) {
            map.push([]);
            for (let j = 0; j < MAP_SIZE; j++) {
                map[i].push(null);
            }
        }
        return map;
    }

    setResources(resources) {
        this.map.resources = resources;
    }

    setRelief(relief) {
        this.map.relief = relief;
    }
}

module.exports = Map;