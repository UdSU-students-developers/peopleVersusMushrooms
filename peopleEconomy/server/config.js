class CONFIG {
    static SERVER_PORT = '3009'; // Хост сервера
    static SERVER_NAME = 'PEOPLE_ECONOMY';  // Имя сервера

    static SQLITE_PATH = './application/modules/db/peopleEconomy.db'; // Путь к базе

    static MAP_URL = 'http://localhost:3001';

    static LOBBY_MAX_SIZE = 5;

    static URL = {
        MAP: 'http://localhost:3001',
        PEOPLE_ARMY: 'http://localhost:3007',
        MUSHROOM_ECONOMY: 'http://localhost:3005',
        MUSHROOM_ARMY: 'http://localhost:3003',
    }

    static ECONOMY = {
        INTERVAL: 200, //ms

        UNIT: {
            RADIUS: 10, //максимальный радиус расчета ближайшей точки от центра стремления(больше 20 не ставить)
        },

        WORKER: {
            HP: 5,
            SPEED: 5,
        }
    }

    //events
    static EVENTS = {
        LOGOUT: 'LOGOUT', 
        START_GAME: 'START_GAME',
    }

    static TRIGGERS = {
        //triggers
        GET_USER_BY_GUID: 'GET_USER_BY_GUID',
        IS_GUID_IN_ANY_LOBBY: 'IS_GUID_IN_ANY_LOBBY',
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
        GET_LOBBIES: 'GET_LOBBYS',
        LOBBY_UPDATED: 'LOBBY_UPDATED',
        LOBBIES_LIST_UPDATED: 'LOBBYS_LIST_UPDATED',
        SET_READY: 'SET_READY',

        GAME_STARTED: 'GAME_STARTED',

    }
}

module.exports = CONFIG;