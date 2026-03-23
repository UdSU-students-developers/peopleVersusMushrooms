const CONFIG = {
    HOST: 'http://localhost:3003', // Адрес сервера mushroomsArmy

    MEDIATOR: {
        EVENTS: {
            SHOW_ERROR: 'SHOW_ERROR',
        },
        TRIGGERS: {
            SET_STORE: 'SET_STORE',
            GET_STORE: 'GET_STORE',
            CLEAR_STORE: 'CLEAR_STORE',
        }
    },

    SOCKET: {
        REGISTRATION: 'registration',
        LOGIN: 'login',
        LOGOUT: 'logout',
    }
};

export default CONFIG;