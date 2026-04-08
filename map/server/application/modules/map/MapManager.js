const { MESSAGES, ROLES } = require("../../../config");
const BaseManager = require("../BaseManager");
const Map = require("./Map");

class MapManager extends BaseManager {
    constructor(options) {
        super(options);

        this.maps = {};

        if (!this.io) return;
        this.io.on('connection', (socket) => {
            socket.on(MESSAGES.GENERATE_MAP, (data) => this.socketGenerateMap(data, socket));
            socket.on(MESSAGES.GET_MAP_PARAMS, (data) => this.socketGetMapParams(data, socket));
        });

        const {
            GET_RELIEF_HANDLER,
            GET_VISIBILITY_HANDLER,
            GET_RESOURSE_VISIBILITY_HANDLER,
            UPDATE_UNITS_HANDLER,
            UPDATE_BUILDINGS_HANDLER
        } = this.TRIGGERS;


        this.mediator.set(GET_RELIEF_HANDLER, (data) => this.getReliefHandler(data));
        // взимодействие с остальными
        // input (это сервисы говорят мне)
        // изменения в экономике (строительство, уничтожение) зданий/труб/грибниц
        this.mediator.set(UPDATE_BUILDINGS_HANDLER, (data) => this.updateBuildingsHandler(data));
        // изменение в юнитов (перемещение/создание/уничтожение) юнитов/башен
        this.mediator.set(UPDATE_UNITS_HANDLER, (data) => this.updateUnitsHandler(data));
        //output (это сервисы могут спросить у меня)
        //отдавать сервису значения на карте по его видимости. Видимость - массив точек карты
        this.mediator.set(GET_VISIBILITY_HANDLER, (data) => this.getVisibilityHandler(data));
        //отдавать сервису значения ресурсов по массиву видимостей его разведчиков
        this.mediator.set(GET_RESOURSE_VISIBILITY_HANDLER, (data) => this.getVisibilityHandler(data));

        this.mediator.subscribe(this.EVENTS.START_GAME, (data) => this.eventStartGame(data))
    }

    // ============ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ============

    isUserInAnyLobby(guid) {
        return this.mediator.get(this.TRIGGERS.IS_GUID_IN_ANY_LOBBY, guid);
    }

    getMapByGuid(guid) {
        return Object.values(this.maps).find(map => map.guid === guid);
    }

    getRoleByGuid(map, userGuid) {
        return Object.values(map.playerGuids).find(guid => guid === userGuid)
    }

    //EVENTS
    async eventStartGame(playersGuids) {
        const guid = playersGuids.lobbyGuid;
        //создать карту
        const map = new Map(guid, playersGuids);
        map.generateRelief();
        map.generateSources();
        this.maps[map.guid] = map;

        //сообщить всем сервисам, что игра началась и сообщить guid карты
        const result1 = await this.send(
            `http://localhost:3009/startGame/${playersGuids.peopleEconomy}`,
            playersGuids
        );
        /*
        const result2 = await this.send(
            `http://localhost:3007/startGame/${playersGuids.peopleArmy}`,
            playersGuids
        );
        const result3 = await this.send(
            `http://localhost:3005/startGame/${playersGuids.mushroomEconomy}`,
            playersGuids
        );
        const result4 = await this.send(
            `http://localhost:3003/startGame/${playersGuids.mushroomArmy}`,
            playersGuids
        );*/
    }

    //TRIGGERS

    //HANDLERS

    getReliefHandler(data = {}) {
        const { mapGuid, userGuid } = data;

        // проверяем, что карта с таким гуидом есть
        const map = this.maps[mapGuid];
        if (!map) return this.answer.bad(3002);

        // определяем роль игрока на карте по гуиду
        const role = this.getRoleByGuid(map, userGuid);
        if (!role) return this.answer.bad(3003);

        return map.getRelief();
    }

    updateUnitsHandler(data = {}) {
        const { mapGuid, userGuid, units } = data;

        // проверяем, что карта с таким гуидом есть
        const map = this.maps[mapGuid];
        if (!map) return this.answer.bad(3002);

        // определяем роль игрока на карте по гуиду
        const role = this.getRoleByGuid(map, userGuid);
        if (!role) return this.answer.bad(3003);

        // если спектатор - пинаем
        //if (role === ROLES.SPECTATOR) return this.answer.bad(3004);

        units.forEach(unit => map.updateUnit({ ...unit, role }));

        return this.answer.good(true);
    }

    updateBuildingsHandler(data = {}) {
        const { mapGuid, userGuid, buildings } = data;

        // проверяем, что карта с таким гуидом есть
        const map = this.maps[mapGuid];
        if (!map) return this.answer.bad(3002);

        // определяем роль игрока на карте по гуиду
        const role = this.getRoleByGuid(map, userGuid);
        if (!role) return this.answer.bad(3003);

        // если спектатор - пинаем
        //if (role === ROLES.SPECTATOR) return this.answer.bad(3004);

        buildings.forEach(building => map.updateUnit({ ...building, role }));

        return this.answer.good(true);
    }

    getVisibilityHandler(data = {}) {
        const { mapGuid, userGuid } = data;

        // проверяем, что карта с таким гуидом есть
        const map = this.maps[mapGuid];
        if (!map) return this.answer.bad(3002);

        // определяем роль игрока на карте по гуиду
        const playerGuids = map.playerGuids;
        const role = Object.keys(playerGuids).find(role => playerGuids[role] === userGuid);
        if (!role) return this.answer.bad(3003);

        // если спектатор - пинаем
        if (role === ROLES.SPECTATOR) return this.answer.bad(3004);

        return this.answer.good(map.getVisbileEntitiesByRole(role));
    }

    getResourseVisibilityHandler(data = {}) {
        const { mapGuid, userGuid } = data;

        // проверяем, что карта с таким гуидом есть
        const map = this.maps[mapGuid];
        if (!map) return this.answer.bad(3002);

        // определяем роль игрока на карте по гуиду
        const playerGuids = map.playerGuids;
        const role = Object.keys(playerGuids).find(role => playerGuids[role] === userGuid);
        if (!role) return this.answer.bad(3003);

        // если спектатор - пинаем
        if (role === ROLES.SPECTATOR) return this.answer.bad(3004);

        return this.answer.good(map.getVisbileSoursesByRole(role));
    }

    //SOCKETS
    socketGenerateMap(data, socket) {
        const { guid, width, height, water, mountains, seed, iron, oil } = data;
        const playerGuids = {
            spectator: null,
            peopleArmy: null,
            peopleEconomy: null,
            mushroomArmy: null,
            mushroomEconomy: null,
        };
        const map = new Map(guid, playerGuids, width, height);
        map.generateRelief(water, mountains, seed);
        map.generateSources(iron, oil);
        this.maps[map.guid] = map;
        socket.emit(
            MESSAGES.GENERATE_MAP,
            this.answer.good({ map: map.getRelief(), ...map.getSelf() })
        );
    }

    socketGetMapParams(data, socket) {
        const { mapGuid } = data;
        const map = this.getMapByGuid(mapGuid)
        if (!map) socket.emit(MESSAGES.GET_MAP_PARAMS, this.answer.bad(3008));

        socket.emit(MESSAGES.GET_MAP_PARAMS, this.answer.good(map.getGen()));
    }
}

module.exports = MapManager;