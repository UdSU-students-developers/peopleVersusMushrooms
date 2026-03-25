const { MESSAGES } = require("../../../config");
const BaseManager = require("../BaseManager");
const Map = require("./Map");


class MapManager extends BaseManager {
    constructor(options) {
        super(options);

        if (!this.io) return;

        this.maps = [];

        this.io.on('connection', (socket) => {
            socket.on(MESSAGES.GENERATE_MAP, (data) => this.socketGenerateMap(data, socket));
        });
    }

    socketGenerateMap(data, socket) {
        const { width, height, water, mountains, seed, iron, oil } = data;
        const map = new Map(width, height);
        map.generateRelief(water, mountains, seed);
        map.generateFields(iron, oil);
        this.maps.push(map);
        socket.emit(MESSAGES.GENERATE_MAP, this.answer.good(map.get()));    
    }
}

module.exports = MapManager;