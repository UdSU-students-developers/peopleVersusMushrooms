export enum EMESSAGES {
    CHECK = 'CHECK',
    SEND_TO_ALL = 'SEND_TO_ALL',
    LOBBIES_LIST_UPDATED = 'LOBBIES_LIST_UPDATED',
    LOBBY_UPDATED = 'LOBBY_UPDATED',
    GET_LOBBIES = 'GET_LOBBIES',
    START_GAME = 'START_GAME',
    DROP_FROM_LOBBY = 'DROP_FROM_LOBBY',
    LEAVE_LOBBY = 'LEAVE_LOBBY',
    JOIN_TO_LOBBY = 'JOIN_TO_LOBBY',
    CREATE_LOBBY = 'CREATE_LOBBY',
    GAME_STARTED = 'GAME_STARTED',
    GET_CURRENT_LOBBY = 'GET_CURRENT_LOBBY',
    GET_LOBBIES_LIST = 'GET_LOBBIES_LIST',
    GET_USER = 'GET_USER'
};

export const MEDIATOR = {
    EVENTS: {
        REGISTRATION: 'REGISTRATION',
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',
        SHOW_ERROR: 'SHOW_ERROR',
        GENERATE_MAP: 'GENERATE_MAP',
        GET_MAP_GENERATION: 'GET_MAP_GENERATION'
    },
    TRIGGERS: {
        GET_TOKEN: 'GET_TOKEN',
    }
};

export type TWINDOW = {
    LEFT: number;
    TOP: number;
    HEIGHT: number;
    WIDTH: number;
}

const CONFIG = {
    HOST: 'http://localhost:3001', // Адрес сервера

    // игровое окно, видимое пользователю
    WINDOW: {
        LEFT: 0,
        TOP: 0,
        HEIGHT: 800,
        WIDTH: 800,
    },
    WIDTH: 100,
    HEIGHT: 100
};

export default CONFIG;