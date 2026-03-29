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
            LOGIN: "LOGIN",                       // триггер для логина (возвращает пользователя)
            LOGOUT: "LOGOUT",                     // триггер для логаута (возвращает true/false)
            SET_UNIT_TARGET: "SET_UNIT_TARGET",   // задать юниту цель движения (см. ArmyManager)
            CREATE_UNIT: "CREATE_UNIT",           // создать юнита (см. ArmyManager)
        },
    },

    SOCKET: {
        MESSAGE_FROM_CLIENT: "message_from_client",
        MESSAGE_TO_CLIENTS: "message_to_clients",
        REGISTRATION: "registration",
        LOGIN: "login",
        LOGOUT: "logout",
    },

    ARMY: {
        INTERVAL: 100, //ms
    }
}

module.exports = CONFIG;