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
        EVENTS: {
            REGISTRATION: "REGISTRATION",
            LOGIN: "LOGIN",
            LOGOUT: "LOGOUT"
        },
    }
}

module.exports = CONFIG;