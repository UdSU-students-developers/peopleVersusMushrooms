export enum EMESSAGES {
    CHECK = 'CHECK',
    SEND_TO_ALL = 'SEND_TO_ALL',
};

export const MEDIATOR = {
    EVENTS: {
        LOBBIES_LIST_UPDATED: 'LOBBIES_LIST_UPDATED',
        LOBBY_UPDATED: 'LOBBY_UPDATED',
        GET_LOBBIES: 'GET_LOBBIES',
        START_GAME: 'START_GAME',
        DROP_FROM_LOBBY: 'DROP_FROM_LOBBY',
        LEAVE_LOBBY: 'LEAVE_LOBBY',
        JOIN_TO_LOBBY: 'JOIN_TO_LOBBY',
        CREATE_LOBBY: 'CREATE_LOBBY',
        GAME_STARTED: 'GAME_STARTED',
        REGISTRATION: 'REGISTRATION',
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',
        SHOW_ERROR: 'SHOW_ERROR'
    },
    TRIGGERS: {
        GET_TOKEN: 'GET_TOKEN',
        GET_CURRENT_LOBBY: 'GET_CURRENT_LOBBY',
        GET_LOBBIES_LIST: 'GET_LOBBIES_LIST',
        GET_USER: 'GET_USER'
    }
};

const CONFIG = {
    HOST: 'http://localhost:3001', // Адрес сервера
};

export default CONFIG;