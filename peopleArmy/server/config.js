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
            START_GAME: 'START_GAME',
            LOBBY_UPDATED: 'LOBBY_UPDATED',
            USER_DISCONNECT: 'USER_DISCONNECT',
        },
        TRIGGERS: {
            GET_USER_BY_GUID: 'GET_USER_BY_GUID',

            CREATE_UNIT: "CREATE_UNIT",           // создать юнита (см. ArmyManager)
            UNIT_TAKE_DAMAGE: "UNIT_TAKE_DAMAGE", // нанести урон юниту (см. ArmyManager)
        },
    },

    SOCKETS: {
        ...GLOBAL_CONFIG.SOCKET,
        // local-only events (not defined in global config)
        MESSAGE_FROM_CLIENT: "message_from_client",
        MESSAGE_TO_CLIENTS: "message_to_clients",
        UPDATE_ARMY: 'UPDATE_ARMY',
    },

    ARMY: {
        INTERVAL: 100, //ms
    }
}

CONFIG.MEDIATOR = {
    EVENTS: {
        ...GLOBAL_CONFIG.EVENTS,
        ...CONFIG.MEDIATOR.EVENTS,
    },
    TRIGGERS: {
        ...GLOBAL_CONFIG.TRIGGERS,
        ...CONFIG.MEDIATOR.TRIGGERS,
    },
};

module.exports = CONFIG;
