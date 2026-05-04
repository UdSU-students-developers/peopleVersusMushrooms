const { URLS } = require("../../../../../global/globalConfig");
const { MESSAGES, ROLES } = require("../../../config");
const BaseManager = require("../BaseManager");
const Map = require("./Map");

class MapManager extends BaseManager {
    constructor(options) {
        super(options);

        this.maps = {};

        if (!this.io) return;
        
        this.io.on('connection', (socket) => {
            socket.on(MESSAGES.UPDATE_MAP, (data) => this.socketUpdateMap(data, socket));
            socket.on(MESSAGES.GET_MAP_PARAMS, (data) => this.socketGetMapParams(data, socket));
        });

        const {
            GET_RELIEF_HANDLER,
            GET_VISIBILITY_HANDLER,
            GET_RESOURSE_VISIBILITY_HANDLER,
            GET_GENERATED_MAP,
            UPDATE_UNITS_HANDLER,
            UPDATE_BUILDINGS_HANDLER
        } = this.TRIGGERS;

        const {
            CREATE_LOBBY_MAP,
            START_GAME_MAP
        } = this.EVENTS;

        //взимодействие с остальными
        //input (это сервисы говорят мне)
        this.mediator.set(UPDATE_BUILDINGS_HANDLER, (data) => this.updateBuildingsHandler(data));
        this.mediator.set(UPDATE_UNITS_HANDLER, (data) => this.updateUnitsHandler(data));
        //output (это сервисы могут спросить у меня)
        this.mediator.set(GET_VISIBILITY_HANDLER, (data) => this.getVisibilityHandler(data));
        this.mediator.set(GET_RESOURSE_VISIBILITY_HANDLER, (data) => this.getResourseVisibilityHandler(data));
        //отдать всю проходимость
        this.mediator.set(GET_RELIEF_HANDLER, (data) => this.getReliefHandler(data));

        this.mediator.subscribe(CREATE_LOBBY_MAP, (data) => this.eventCreateLobby(data));
        this.mediator.subscribe(START_GAME_MAP, (data) => this.eventStartGame(data));
    }

    // ============ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ============

    _getRoleByGuid(map, userGuid) {
        return Object.keys(map.playerGuids).find(role => map.playerGuids[role] === userGuid);
    }

    _updateEntities(data, method) {
        const { mapGuid, userGuid, entities } = data;
        // проверяем, что карта с таким гуидом есть
        const map = this.maps[mapGuid];
        if (!map) return this.answer.bad(3002);
        // определяем роль игрока на карте по гуиду
        const role = this._getRoleByGuid(map, userGuid);
        if (!role) return this.answer.bad(3003);

        entities.forEach(entity => map[method]({ ...entity, role }));

        socket.emit(MESSAGES.UPDATE_MAP, this.answer.good(map.get()));
        return this.answer.good(true);
    }

    _getVisibility(data, method) {
        const { mapGuid, userGuid } = data;
        // проверяем, что карта с таким гуидом есть
        const map = this.maps[mapGuid];
        if (!map) return this.answer.bad(3002);
        // определяем роль игрока на карте по гуиду
        const role = this._getRoleByGuid(map, userGuid);
        if (!role) return this.answer.bad(3003);
        return this.answer.good(map[method](role));
    }

    //EVENTS
    eventCreateLobby(lobbyGuids) {
        const { lobbyGuid, ...playerGuids } = lobbyGuids;
        const map = new Map({ guid: lobbyGuid, playerGuids });
        map.generateRelief();
        map.generateSources();
        map.generateStartingPositions();
        this.maps[lobbyGuid] = map;
    }

    async eventStartGame(lobbyGuids) {
        const { lobbyGuid, ...playerGuids } = lobbyGuids;
        const map = this.maps[lobbyGuid];
        map.playerGuids = { ...playerGuids };
        //сообщить всем сервисам, что игра началась и сообщить guid карты
        this.sendToAll(URLS.START_GAME, { mapGuid: lobbyGuid, ...playerGuids });
        socket.emit(MESSAGES.START_GAME, this.answer.good({ mapGuid: lobbyGuid, ...playerGuids }))
    }

    //TRIGGERS

    //HANDLERS

    getReliefHandler(data = {}) {
        const { mapGuid, userGuid } = data;
        // проверяем, что карта с таким гуидом есть
        const map = this.maps[mapGuid];
        if (!map) return this.answer.bad(3002);
        // определяем роль игрока на карте по гуиду
        const role = this._getRoleByGuid(map, userGuid);
        if (!role) return this.answer.bad(3003);

        return map.getRelief();
    }

    updateUnitsHandler(data = {}) {
        return this._updateEntities(data, 'updateUnit')
    }

    updateBuildingsHandler(data = {}) {
        return this._updateEntities(data, 'updateBuilding')
    }

    getVisibilityHandler(data = {}) {
        return this._getVisibility(data, 'getVisbileEntitiesByRole');
    }

    getResourseVisibilityHandler(data = {}) {
        return this._getVisibility(data, 'getVisbileSourcesByRole');
    }

    // ============ SOCKETS ============
    socketUpdateMap(data, socket) {
        this._socketGets(data, 'get', MESSAGES.UPDATE_MAP, socket);
    }

    socketGetMapParams(data, socket) {
        this._socketGets(data, 'getGen', MESSAGES.GET_MAP_PARAMS, socket);
    }
}

module.exports = MapManager;