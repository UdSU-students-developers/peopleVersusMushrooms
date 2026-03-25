class CONFIG {
    static SERVER_PORT = '3001'; // Хост сервера
    static SERVER_NAME = 'MAP';  // Имя сервера

    static SQLITE_PATH = './application/modules/db/map.db'; // Путь к базе

    static ROOM_SIZE = { // размеры комнаты
        MIN: 1,
        MAX: 2,
    }
    //ивенты
    static EVENTS = {
        //map events
    }

    //триггеры
    static TRIGGERS = {
        //map triggers
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
        CREATE_ROOM: 'CREATE_ROOM',
        JOIN_TO_ROOM: 'JOIN_ROOM',
        LEAVE_ROOM: 'LEAVE_ROOM',
        DROP_FROM_ROOM: 'DROP_FROM_ROOM',
        START_GAME: 'START_GAME',
        GET_ROOMS: 'GET_ROOMS',
        ROOM_UPDATED: 'ROOM_UPDATED',
        ROOMS_LIST_UPDATED: 'ROOMS_LIST_UPDATED',

        //map sockets
        GENERATE_MAP: 'GENERATE_MAP',
    }
}

module.exports = CONFIG;