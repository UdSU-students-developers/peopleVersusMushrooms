export enum EMESSAGES {
    CHECK = 'CHECK',
    SEND_TO_ALL = 'SEND_TO_ALL',
    //user sockets
    LOGIN = 'LOGIN',
    REGISTRATION = 'REGISTRATION',
    LOGOUT = 'LOGOUT',
    GET_TOKEN = 'GET_TOKEN',
};

const CONFIG = {
    HOST: 'http://localhost:3001', // Адрес сервера
};

export default CONFIG;