const CONFIG = {
    HOST: 'http://localhost:3005', // Адрес сервера
    CHAT_MAX_MESSAGE_LENGTH: 255,

    MEDIATOR: {
        EVENTS: {
            LOGIN: 'LOGIN',
            NEW_MESSAGE: 'NEW_MESSAGE',
            MESSAGE_LOADED: 'MESSAGE_LOADED',
            MESSAGE_SENT: 'MESSAGE_SEND',
        },
        TRIGGERS: {
            MESSAGE: 'MESSAGE:SOCKET',

            SET_STORE: 'SET_STORE',
            GET_STORE: 'GET_STORE',
            CLEAR_STORE: 'CLEAR_STORE',

            ERROR: "ERROR",
        }
    },

    SOCKET: {
        MESSAGE: 'MESSAGE',  // шлет сообщение
        MESSAGES: 'MESSAGES',
        NEW_MESSAGE: 'NEW_MESSAGE',
        TYPING: 'TYPING',    // печатает

        REGISTRATION: 'REGISTRATION',
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',
    }
};

export default CONFIG;