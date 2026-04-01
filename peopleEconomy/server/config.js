class CONFIG {
    static SERVER_PORT = '3009'; // Хост сервера
    static SERVER_NAME = 'PEOPLE_ECONOMY';  // Имя сервера

    static SQLITE_PATH = './application/modules/db/peopleEconomy.db'; // Путь к базе

    static MAP_URL = 'http://localhost:3001';

    static LOBBY_MAX_SIZE = 5;


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

    static ECONOMY = {
        WORKER_HP: 5,
        WORKER_SPEED: 5,
    }
}

module.exports = CONFIG;