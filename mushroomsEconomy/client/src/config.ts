const CONFIG = {
    HOST: 'http://localhost:3005', // Адрес сервера

    MEDIATOR: {
        EVENTS: {
            // служебные события
            SHOW_ERROR: 'SHOW_ERROR',
            SHOW_POPUP: 'SHOW_POPUP',
            // остальные события
            LOGIN: 'LOGIN',
        },
        TRIGGERS: {

            // служебные триггеры
            SET_STORE: 'SET_STORE',
            GET_STORE: 'GET_STORE',
            CLEAR_STORE: 'CLEAR_STORE',
            // остальные триггеры
            MESSAGE: 'MESSAGE:SOCKET',
        }
    },

    SOCKET: {
        MESSAGE: 'MESSAGE',  // шлет сообщение

        REGISTRATION: 'REGISTRATION',
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',
    }
};

export default CONFIG;