export enum EMESSAGES {
    CHECK = 'CHECK',
    SEND_TO_ALL = 'SEND_TO_ALL',
};

export const MEDIATOR = {
    EVENTS: {
        ROOMS_LIST_UPDATED: 'ROOMS_LIST_UPDATED',
        ROOM_UPDATED: 'ROOM_UPDATED',
        GET_ROOMS: 'GET_ROOMS',
        START_GAME: 'START_GAME',
        DROP_FROM_ROOM: 'DROP_FROM_ROOM',
        LEAVE_ROOM: 'LEAVE_ROOM',
        JOIN_TO_ROOM: 'JOIN_TO_ROOM',
        CREATE_ROOM: 'CREATE_ROOM',
        GAME_STARTED: 'GAME_STARTED',
        REGISTRATION: 'REGISTRATION',
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',
        SHOW_ERROR: 'SHOW_ERROR'
    },
    TRIGGERS: {
        GET_TOKEN: 'GET_TOKEN',
        GET_CURRENT_ROOM: 'GET_CURRENT_ROOM',
        GET_ROOMS_LIST: 'GET_ROOMS_LIST',
        GET_USER: 'GET_USER'
    }
};

const CONFIG = {
    HOST: 'http://localhost:3001', // Адрес сервера
};

export default CONFIG;