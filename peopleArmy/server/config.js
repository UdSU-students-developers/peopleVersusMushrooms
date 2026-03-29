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
            GET_ALL_UNITS: "GET_ALL_UNITS",       // получить всех юнитов армии (см. ArmyManager)
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

        SOLDIER: {
            HP: 10,
            SPEED: 1,
            RANGE: 3, // дальность стрельбы
            VISIBLE: 5 // дальность видимости
        },
        BMP: {
            HP: 100,
            SPEED: 3,
            RANGE: 5, // дальность стрельбы
            VISIBLE: 3 // дальность видимости
        },
    }
}

module.exports = CONFIG;
