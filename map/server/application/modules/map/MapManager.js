const { MESSAGES } = require("../../../config");
const BaseManager = require("../BaseManager");
const Map = require("./Map");


class MapManager extends BaseManager {
    constructor(options) {
        super(options);

        this.maps = {};

        if (!this.io) return;
        this.io.on('connection', (socket) => {
            socket.on(MESSAGES.GENERATE_MAP, (data) => this.socketGenerateMap(data, socket));
        });

        // взимодействие с остальными
        // input (это сервисы говорят мне)
        // изменения в экономике (строительство, уничтожение) зданий/труб/грибниц
        // изменение в экономике (перемещение и пр.) строителей/разведчиков
        // изменение в армии (перемещение/создание/уничтожение) юнитов/башен

        //output (это сервисы могут спросить у меня)
        //отдавать сервису значения на карте по его видимости. Видимость - массив точек карты
        //отдавать сервису значения ресурсов по массиву видимостей его разведчиков
        const {GET_VISIBILY_HANDLER, GET_RESOURSE_VISIBILITY_HANDLER} = this.TRIGGERS
        this.mediator.set(GET_VISIBILY_HANDLER, (data) => this.getVisibilityHandler(data));
    }

    //TRIGGERS

    //HANDLERS

    getVisibilityHandler(data = {}) {
        const {mapGuid, userGuid, visibility} = data;
        //...

        return this.answer.good({});
    }

    //SOCKETS
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