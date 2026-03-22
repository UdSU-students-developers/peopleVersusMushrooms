const CONFIG = {
    NAME: 'Server',
    PORT: 3003, //Порт соостветсвующий серверу вашего сервиса

    DATABASE: {
        NAME: 'mushroomsArmy.db',
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
        REGISTRATION: 'registration',
        LOGIN: 'login',
        LOGOUT: 'logout'
    }
}

module.exports = CONFIG;