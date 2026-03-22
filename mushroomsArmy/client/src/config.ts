const CONFIG = {
    HOST: 'http://localhost:3003', // Адрес сервера mushroomsArmy

    MEDIATOR: {
        EVENTS: {
            USER_REGISTERED: 'USER_REGISTERED',
            USER_LOGGED_IN: 'USER_LOGGED_IN',
            USER_LOGGED_OUT: 'USER_LOGGED_OUT',
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