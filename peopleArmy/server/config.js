const CONFIG = {
    NAME: 'PeoplesArmy',
    PORT: 3007, //Порт соостветсвующий серверу вашего сервиса

    DATABASE: {
        NAME: 'data.db',
    },

    MEDIATOR: {
        EVENTS: {
            USER_REGISTERED: "USER_REGISTERED",   // вызывается после успешной регистрации
            SOCKET_MESSAGE_RECEIVED: "SOCKET_MESSAGE_RECEIVED",  // сообщение получено от клиента
            SOCKET_BROADCAST_MESSAGE: "SOCKET_BROADCAST_MESSAGE",  // рассылка сообщения всем клиентам
        },
        TRIGGERS: {
            REGISTER: "REGISTER",                 // триггер для регистрации (возвращает результат)
            SOCKET_HANDLE_MESSAGE: "SOCKET_HANDLE_MESSAGE",  // обработчик сообщения от клиента
            SOCKET_BROADCAST_TO_ALL: "SOCKET_BROADCAST_TO_ALL",  // рассылать всем клиентам
        },
    },

    SOCKET: {
        EVENTS: {
            CONNECTION: "connection",
            DISCONNECT: "disconnect",
            MESSAGE_FROM_CLIENT: "message_from_client",
            MESSAGE_TO_CLIENTS: "message_to_clients",
        },
    },
}

module.exports = CONFIG;