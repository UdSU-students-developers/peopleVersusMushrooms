const CONFIG = {
    NAME: 'PeopleArmy',
    PORT: 3007, //Порт соостветсвующий серверу вашего сервиса
    ROLE: 'peopleArmy',
    START_POINT: {x: 4, y: 4},
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
            DELETE_USER: 'DELETE_USER',
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
        REGISTRATION: "registration",
        LOGIN: "login",
        LOGOUT: "logout",

        UPDATE_ARMY: 'UPDATE_ARMY',
    },
}

module.exports = CONFIG;