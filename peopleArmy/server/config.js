const CONFIG = {
    NAME: 'PeoplesArmy',
    PORT: 3007, //Порт соостветсвующий серверу вашего сервиса

    DATABASE: {
        NAME: 'data.db',
    },

    MEDIATOR: {
        EVENTS: {
            START_GAME: 'START_GAME',
        },
        TRIGGERS: {
            GET_USER_BY_GUID: 'GET_USER_BY_GUID',

            SET_UNIT_TARGET: "SET_UNIT_TARGET",   // задать юниту цель движения (см. ArmyManager)
            CREATE_UNIT: "CREATE_UNIT",           // создать юнита (см. ArmyManager)
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

    ARMY: {
        INTERVAL: 100, //ms
    }
}

module.exports = CONFIG;