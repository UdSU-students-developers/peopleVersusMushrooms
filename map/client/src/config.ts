export enum EMESSAGES {
    CHECK = 'CHECK',
    SEND_TO_ALL = 'SEND_TO_ALL',
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
        GET_TOKEN: 'GET_TOKEN'
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