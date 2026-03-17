const CONFIG = {
    HOST: 'http://localhost:3005', // Адрес сервера

    MEDIATOR: {
        EVENTS: {
            LOGIN: 'LOGIN',
            LOGIN: 'LOGIN',
        },
        TRIGGERS: {
            MESSAGE: 'MESSAGE:SOCKET',

            SET_STORE: 'SET_STORE',
            GET_STORE: 'GET_STORE',
            CLEAR_STORE: 'CLEAR_STORE',

            ERROR: "error",
        }
    },

    SOCKET: {
        MESSAGE: 'MESSAGE',  // шлет сообщение
        TYPING: 'TYPING',    // печатает

        REGISTRATION: 'REGISTRATION',
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',
    }
};

export default CONFIG;