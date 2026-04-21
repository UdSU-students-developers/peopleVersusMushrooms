const GLOBAL_CONFIG = require('../../global/globalConfig');

const CONFIG = {
    NAME: 'PeopleArmy',
    PORT: 3007, //Порт соостветсвующий серверу вашего сервиса
    ROLE: 'peopleArmy',
    CORS: {
        origin: "*",
        middleware: (_, res, next) => {
            res.header('Content-Type', 'application/json; charset=utf-8');
            res.header('Access-Control-Allow-Origin', '*');
            next();
        }
    },

    DATABASE: {
        NAME: 'data.db',
    },

    MEDIATOR: {
        EVENTS: {
            START_GAME: GLOBAL_CONFIG.SOCKET.START_GAME,
            LOBBY_UPDATED: GLOBAL_CONFIG.SOCKET.LOBBY_UPDATED,
            USER_DISCONNECT: 'USER_DISCONNECT',
        },
        TRIGGERS: {
            GET_USER_BY_GUID: 'GET_USER_BY_GUID',

            CREATE_UNIT: "CREATE_UNIT",           // создать юнита (см. ArmyManager)
            UNIT_TAKE_DAMAGE: "UNIT_TAKE_DAMAGE", // нанести урон юниту (см. ArmyManager)
        },
    },

    SOCKETS: {
        MESSAGE_FROM_CLIENT: "message_from_client",
        MESSAGE_TO_CLIENTS: "message_to_clients",
        REGISTRATION: GLOBAL_CONFIG.SOCKET.REGISTRATION,
        LOGIN: GLOBAL_CONFIG.SOCKET.LOGIN,
        LOGOUT: GLOBAL_CONFIG.SOCKET.LOGOUT,
        CREATE_LOBBY: GLOBAL_CONFIG.SOCKET.CREATE_LOBBY,
        JOIN_TO_LOBBY: GLOBAL_CONFIG.SOCKET.JOIN_TO_LOBBY,
        LEAVE_LOBBY: GLOBAL_CONFIG.SOCKET.LEAVE_LOBBY,
        DROP_FROM_LOBBY: GLOBAL_CONFIG.SOCKET.DROP_FROM_LOBBY,
        GET_LOBBIES: GLOBAL_CONFIG.SOCKET.GET_LOBBIES,
        LOBBY_UPDATED: GLOBAL_CONFIG.SOCKET.LOBBY_UPDATED,
        SET_READY: GLOBAL_CONFIG.SOCKET.SET_READY,
        START_GAME: GLOBAL_CONFIG.SOCKET.START_GAME,

        UPDATE_ARMY: 'UPDATE_ARMY',
    },

    ARMY: {
        INTERVAL: 100, //ms
    }
}

module.exports = CONFIG;
