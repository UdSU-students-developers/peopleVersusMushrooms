const CONFIG = {
    HOST: 'http://localhost:3005', // Адрес сервера

    MEDIATOR: {
        EVENTS: {

        },
        TRIGGERS: {
            MESSAGE: 'message:socket'
        }
    },

    SOCKET: {
        MESSAGE: 'message',  // шлет сообщение
        TYPING: 'typing',           // печатает

        REGISTRATION: 'registration',
        LOGIN: 'login',
        LOGOUT: 'logout',
    }
};

export default CONFIG;