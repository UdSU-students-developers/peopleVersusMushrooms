export enum EMESSAGES {
    CHECK = 'CHECK',
    SEND_TO_ALL = 'SEND_TO_ALL',
};

export const MEDIATOR = {
    EVENTS: {
        REGISTRATION: 'REGISTRATION',
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',
        SHOW_ERROR: 'SHOW_ERROR'
    },
    TRIGGERS: {
        GET_TOKEN: 'GET_TOKEN'
    }
};

const CONFIG = {
    HOST: 'http://localhost:3001', // Адрес сервера
};

export default CONFIG;