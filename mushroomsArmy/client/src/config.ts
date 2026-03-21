const CONFIG = {
    HOST: 'http://localhost:3002', // Адрес сервера

    MEDIATOR: {
        TRIGGERS: {
            SET_STORE: 'SET_STORE',
            GET_STORE: 'GET_STORE',
            CLEAR_STORE: 'CLEAR_STORE',
        }
    },

    SOCKET: {
        REGISTRATION: 'REGISTRATION',
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',
    }
};

export default CONFIG;