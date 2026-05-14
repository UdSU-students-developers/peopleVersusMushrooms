const CONFIG = {
    HOST: 'http://localhost:3003', // Адрес сервера mushroomsArmy

    MEDIATOR: {
        EVENTS: {
            SHOW_ERROR: 'SHOW_ERROR',
            ERROR: 'ERROR',
            USER_REGISTERED: 'USER_REGISTERED',
            USER_LOGGED_OUT: 'USER_LOGGED_OUT',
            LOGIN: 'LOGIN',

            CREATE_LOBBY: 'CREATE_LOBBY',
            JOIN_TO_LOBBY: 'JOIN_TO_LOBBY',
            LEAVE_LOBBY: 'LEAVE_LOBBY',
            DROP_FROM_LOBBY: 'DROP_FROM_LOBBY',
            SET_READY: 'SET_READY',
            LOBBY_UPDATED: 'LOBBY_UPDATED',
            GET_LOBBYS: 'GET_LOBBYS',
            LOBBYS_LIST_UPDATED: 'LOBBYS_LIST_UPDATED',
            START_GAME: 'START_GAME',

            GAME_STARTED: 'GAME_STARTED',
            GAME_STATE_UPDATED: 'GAME_STATE_UPDATED',
            GAME_OVER: 'GAME_OVER',
        },
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

        CREATE_LOBBY: 'CREATE_LOBBY',
        JOIN_TO_LOBBY: 'JOIN_TO_LOBBY',
        LEAVE_LOBBY: 'LEAVE_LOBBY',
        DROP_FROM_LOBBY: 'DROP_FROM_LOBBY',
        SET_READY: 'SET_READY',
        LOBBY_UPDATED: 'LOBBY_UPDATED',
        GET_LOBBYS: 'GET_LOBBYS',
        LOBBYS_LIST_UPDATED: 'LOBBIES_LIST_UPDATED',
        START_GAME: 'START_GAME',

        LOBBY_START: 'lobby:start',
        GAME_STARTED: 'game:started',
        GAME_STATE: 'game:state',
        GAME_OVER: 'game:over',
        SPAWN_UNIT: 'game:spawn_unit',
    }
};

export default CONFIG;