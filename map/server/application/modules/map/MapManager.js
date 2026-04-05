const { MESSAGES } = require("../../../config");
const BaseManager = require("../BaseManager");
const Map = require("./Map");
const Building = require("./entities/Building");

const Unit = require("./entities/Unit");

class MapManager extends BaseManager {
    constructor(options) {
        super(options);

        this.maps = {};

        if (!this.io) return;
        this.io.on('connection', (socket) => {
            socket.on(MESSAGES.GENERATE_MAP, (data) => this.socketGenerateMap(data, socket));
            socket.on(MESSAGES.GET_MAP_GENERATION, (data) => this.socketGetMapGeneration(data, socket));
        });

        const {
            GET_VISIBILITY_HANDLER,
            GET_RESOURSE_VISIBILITY_HANDLER,
            UPDATE_ECONOMY_UNITS_HANDLER,
            UPDATE_ECONOMY_BUILDINGS_HANDLER,
            UPDATE_ARMY_UNITS_HANDLER
        } = this.TRIGGERS;

        // взимодействие с остальными
        // input (это сервисы говорят мне)
        // изменения в экономике (строительство, уничтожение) зданий/труб/грибниц
        this.mediator.set(UPDATE_ECONOMY_BUILDINGS_HANDLER, (data) => this.updateEconomyBuildingsHandler(data));
        // изменение в экономике (перемещение и пр.) строителей/разведчиков
        this.mediator.set(UPDATE_ECONOMY_UNITS_HANDLER, (data) => this.updateEconomyUnitsHandler(data));
        // изменение в армии (перемещение/создание/уничтожение) юнитов/башен
        this.mediator.set(UPDATE_ARMY_UNITS_HANDLER, (data) => this.updateArmyUnitsHandler(data));
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

    updateEconomyUnitsHandler(data = {}) {
        const { mapGuid, userGuid, units } = data;

        // проверяем, что пользак есть в каком-либо лобби
        const lobby = this.isUserInAnyLobby(userGuid);
        if (!lobby) return this.answer.bad(3003);

        // проверяем, что пользак - экономика (или спектатор)
        if (lobby.playersGuilds.peopleArmy === userGuid ||
            lobby.playersGuilds.mushroomArmy === userGuid) {
            return this.answer.bad(3006);
        }

        // проверяем, что гуид карты и создателя комнаты совпадают
        if (!lobby.creatorGuid === mapGuid) return this.answer.bad(3004);

        // проверяем, что карта с таким гуидом есть
        const map = this.maps[mapGuid];
        if (!map) return this.answer.bad(3005);

        // ищем юнита по гуиду
        for (let unit in units) {
            const unitIndex = map.units.findIndex(elem => unit.guid === elem.guid);
            if (unitIndex + 1) {
                const unitInArray = map.units[unitIndex]
                // если нашелся и не изменился - считаем убитым
                if (unit.x === unitInArray.x && unit.y === unitInArray.y) {
                    map.units.splice(unitIndex, 1);
                } else {
                    // если нашелся и изменился - передвинулся
                    unitInArray.x = unit.x;
                    unitInArray.y = unit.y;
                }
            } else {
                // не нашли - добавляем
                map.units.append(new Unit(
                    unit.x,
                    unit.y,
                    unit.type,
                    unit.guid
                ));
            }
        }
        return this.answer.good(true);
    }

    updateArmyUnitsHandler(data = {}) {
        const { mapGuid, userGuid, units } = data;

        // проверяем, что пользак есть в каком-либо лобби
        const lobby = this.isUserInAnyLobby(userGuid);
        if (!lobby) return this.answer.bad(3003);

        // проверяем, что пользак - армия (или спектатор)
        if (lobby.playersGuilds.peopleEconomy === userGuid ||
            lobby.playersGuilds.mushroomEconomy === userGuid) {
            return this.answer.bad(3007);
        }

        // проверяем, что гуид карты и создателя комнаты совпадают
        if (!lobby.creatorGuid === mapGuid) return this.answer.bad(3004);

        // проверяем, что карта с таким гуидом есть
        const map = this.maps[mapGuid];
        if (!map) return this.answer.bad(3005);

        // ищем юнита по гуиду
        for (let unit in units) {
            const unitIndex = map.units.findIndex(elem => unit.guid === elem.guid);
            if (unitIndex + 1) {
                const unitInArray = map.units[unitIndex]
                // если нашелся и не изменился - считаем убитым
                if (unit.x === unitInArray.x && unit.y === unitInArray.y) {
                    map.units.splice(unitIndex, 1);
                } else {
                    // если нашелся и изменился - передвинулся
                    unitInArray.x = unit.x;
                    unitInArray.y = unit.y;
                }
            } else {
                // не нашли - добавляем
                map.units.append(new Unit(
                    unit.x,
                    unit.y,
                    unit.type,
                    unit.guid
                ));
            }
        }
        return this.answer.good(true);
    }

    updateEconomyBuildingshandler(data = {}) {
        const { mapGuid, userGuid, buildings } = data;

        // проверяем, что пользак есть в каком-либо лобби
        const lobby = this.isUserInAnyLobby(userGuid);
        if (!lobby) return this.answer.bad(3003);

        // проверяем, что пользак - экономика (или спектатор)
        if (lobby.playersGuilds.peopleArmy === userGuid ||
            lobby.playersGuilds.mushroomArmy === userGuid) {
            return this.answer.bad(3006);
        }

        // проверяем, что гуид карты и создателя комнаты совпадают
        if (!lobby.creatorGuid === mapGuid) return this.answer.bad(3004);

        // проверяем, что карта с таким гуидом есть
        const map = this.maps[mapGuid];
        if (!map) return this.answer.bad(3005);

        // ищем юнита по гуиду
        for (let building in buildings) {
            const buildingIndex = map.buildings.findIndex(elem => building.guid === elem.guid);
            if (buildingIndex + 1) {
                // если нашелся - уничтожаем
                map.buildings.splice(buildingIndex, 1);
            } else {
                // не нашли - добавляем
                map.buildings.append(new Building(
                    building.x,
                    building.y,
                    building.type,
                    building.guid,
                    building.size ? building.size : 1
                ));
            }
        }
        return this.answer.good(true);
    }

    getVisibilityHandler(data = {}) {
        const { mapGuid, userGuid, visibility } = data;

        // проверяем, что пользак есть в каком-либо лобби
        const lobby = this.isUserInAnyLobby(userGuid);
        if (!lobby) return this.answer.bad(3003);

        // проверяем, что гуид карты и создателя комнаты совпадают
        if (!lobby.creatorGuid === mapGuid) return this.answer.bad(3004);

        // проверяем, что карта с таким гуидом есть
        const map = this.maps[mapGuid];
        if (!map) return this.answer.bad(3005);

        const res = map.getTilesByVisibility(visibility);

        return this.answer.good(res);
    }

    getResourseVisibilityHandler(data = {}) {
        const { mapGuid, userGuid, visibility } = data;

        // проверяем, что пользак есть в каком-либо лобби
        const lobby = this.isUserInAnyLobby(userGuid);
        if (!lobby) return this.answer.bad(3003);

        // проверяем, что гуид карты и создателя комнаты совпадают
        if (!lobby.creatorGuid === mapGuid) return this.answer.bad(3004)

        // проверяем, что карта с таким гуидом есть
        const map = this.maps[mapGuid];
        if (!map) return this.answer.bad(3005);

        const res = map.getTilesBySourcesVisibility(visibility);

        return this.answer.good(res);
    }

    //SOCKETS
    socketGenerateMap(data, socket) {
        const { guid, width, height, water, mountains, seed, iron, oil } = data;
        const map = new Map(guid, width, height);
        map.generateRelief(water, mountains, seed);
        //map.generateFields(iron, oil);
        this.maps[map.guid] = map;
        socket.emit(MESSAGES.GENERATE_MAP, this.answer.good(map.getSelf()));
    }

    socketGetMapGeneration(data, socket) {
        const { guid } = data;
        const map = this.getMapByGuid(guid)
        if (!map) {
            socket.emit(MESSAGES.GET_MAP_GENERATION, this.answer.bad(3008));
        } 
        socket.emit(MESSAGES.GET_MAP_GENERATION, this.answer.good(map.getGen()));
    }
}

module.exports = MapManager;