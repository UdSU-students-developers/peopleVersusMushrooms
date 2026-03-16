const CONFIG = {
    NAME: 'PeoplesArmy',
    PORT: 3007, //Порт соостветсвующий серверу вашего сервиса

    DATABASE: {
        NAME: 'data.db',
    },

    MEDIATOR: {
        EVENTS: {
            USER_REGISTERED: "USER_REGISTERED",   // вызывается после успешной регистрации
        },
        TRIGGERS: {
            REGISTER: "REGISTER",                 // триггер для регистрации (возвращает результат)
        },
    },

    SOCKET: {
        MESSAGE_FROM_CLIENT: "message_from_client",
        MESSAGE_TO_CLIENTS: "message_to_clients",
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