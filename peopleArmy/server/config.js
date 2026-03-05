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
}

module.exports = CONFIG;