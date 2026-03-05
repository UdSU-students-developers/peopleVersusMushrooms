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
        CLIENT: {
            SEND_MESSAGE: 'client:message',  // клиент шлет сообщение
            TYPING: 'client:typing'           // клиент печатает
        },
        SERVER: {
            NEW_MESSAGE: 'server:new:message', // сервер разослал сообщение
            USER_TYPING: 'server:user:typing'  // сервер сообщает, что кто-то печатает
        }
    }
}

module.exports = CONFIG;