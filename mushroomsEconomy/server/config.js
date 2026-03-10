const CONFIG = {
    NAME: 'Server',
    PORT: 3005, //Порт соостветсвующий серверу вашего сервиса

    DATABASE: {
        NAME: 'data.db',
    },

    MEDIATOR: {
        EVENTS: {
            EXAMPLE_EVENT: "EXAMPLE_EVENT",
        },
        TRIGGERS: {
            EXAMPLE_TRIGGER: "EXAMPLE_TRIGGER",
        },
    },

    SOCKET: {
        MESSAGE: 'message',  // шлет сообщение
        TYPING: 'typing',           // печатает

        REGISTRATION: 'registration',
        LOGIN: 'login',
        LOGOUT: 'logout',
    }
}

module.exports = CONFIG;