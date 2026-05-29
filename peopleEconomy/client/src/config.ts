export enum EMESSAGES {
    CHECK = 'CHECK',
    SEND_TO_ALL = 'SEND_TO_ALL',
    GET_LOBBIES = 'GET_LOBBIES',
    DROP_FROM_LOBBY = 'DROP_FROM_LOBBY',
    GAME_STARTED = 'GAME_STARTED',
    GET_CURRENT_LOBBY = 'GET_CURRENT_LOBBY',
    GET_USER = 'GET_USER'
};

export const MEDIATOR = {
    EVENTS: {
        REGISTRATION: 'REGISTRATION',
        SET_READY: 'SET_READY',
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',
        SHOW_ERROR: 'SHOW_ERROR',
        CREATE_LOBBY: 'CREATE_LOBBY',
        JOIN_TO_LOBBY: 'JOIN_TO_LOBBY',
        LEAVE_LOBBY: 'LEAVE_LOBBY',
        LOBBY_UPDATED: 'LOBBY_UPDATED',
        LOBBIES_LIST_UPDATED: 'LOBBIES_LIST_UPDATED',
        START_GAME: 'START_GAME',
        GET_RELIEF: 'GET_RELIEF',
        UPDATE_MAP: 'UPDATE_MAP'
    },
    TRIGGERS: {
        GET_TOKEN: 'GET_TOKEN',
        GET_LOBBIES: 'GET_LOBBIES',
    }
};

export type TWINDOW = {
    LEFT: number;
    TOP: number;
    HEIGHT: number;
    WIDTH: number;
}

const CONFIG = {
    HOST: 'http://localhost:3009', // Адрес сервера

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