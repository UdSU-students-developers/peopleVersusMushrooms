class CONFIG {
    static SERVER_PORT = '3001'; // Хост сервера
    static SERVER_NAME = 'MAP';  // Имя сервера

    static SQLITE_PATH = './application/modules/db/map.db'; // Путь к базе

    static LOBBY_MAX_SIZE = 5;

    static ROLES = {
        SPECTATOR: 'spectator',
        PEOPLE_ECONOMY: 'peopleEconomy',
        PEOPLE_ARMY: 'peopleArmy',
        MUSHROOM_ECONOMY: 'mushroomEconomy',
        MUSHROOM_ARMY: 'mushroomArmy',
    }

    static URL = {
        PEOPLE_ECONOMY: 'http://localhost:3009',
        PEOPLE_ARMY: 'http://localhost:3007',
        MUSHROOM_ECONOMY: 'http://localhost:3005',
        MUSHROOM_ARMY: 'http://localhost:3003',
    }

    //events
    static EVENTS = {
        CREATE_LOBBY: 'CREATE_LOBBY',
        JOIN_TO_LOBBY: 'JOIN_TO_LOBBY',
        LEAVE_LOBBY: 'LEAVE_LOBBY',
        DROP_FROM_LOBBY: 'DROP_FROM_LOBBY',
        START_GAME: 'START_GAME',
        GET_LOBBIES: 'GET_LOBBIES',
        SET_READY: 'SET_READY',
        LOGOUT: 'LOGOUT',

        START_GAME_MAP: 'START_GAME_MAP',
        CREATE_LOBBY_MAP: 'CREATE_LOBBY_MAP'
    }

    static TRIGGERS = {
        //triggers
        GET_USER_BY_GUID: 'GET_USER_BY_GUID',
        //handlers
        GET_RELIEF_HANDLER: 'GET_RELIEF_HANDLER',
        GET_VISIBILITY_HANDLER: 'GET_VISIBILITY_HANDLER',
        GET_RESOURSE_VISIBILITY_HANDLER: 'GET_RESOURSE_VISIBILITY_HANDLER',
        GET_GENERATED_MAP: 'GET_GENERATED_MAP',
        UPDATE_UNITS_HANDLER: 'UPDATE_UNITS_HANDLER',
        UPDATE_BUILDINGS_HANDLER: 'UPDATE_BUILDINGS_HANDLER',
    }

    // сокетные сообщения
   static MESSAGES = {
        CHECK: 'CHECK',
        SEND_TO_ALL: 'SEND_TO_ALL',
        
        // user sockets
        LOGIN: 'LOGIN',
        REGISTRATION: 'REGISTRATION',
        LOGOUT: 'LOGOUT',
        
        // lobby sockets
        CREATE_LOBBY: 'CREATE_LOBBY',
        JOIN_TO_LOBBY: 'JOIN_TO_LOBBY',
        LEAVE_LOBBY: 'LEAVE_LOBBY',
        DROP_FROM_LOBBY: 'DROP_FROM_LOBBY',
        START_GAME: 'START_GAME',
        GET_LOBBIES: 'GET_LOBBIES',
        LOBBIES_LIST_UPDATED: 'LOBBIES_LIST_UPDATED',
        SET_READY: 'SET_READY',

        //map sockets
        GENERATE_MAP: 'GENERATE_MAP',
        UPDATE_MAP: 'UPDATE_MAP',
        GET_MAP_PARAMS: 'GET_MAP_PARAMS'
    }

    static FIELD_NAMES = {
        IRON: 'IRON',
        OIL: 'OIL'
    }
}

module.exports = CONFIG;