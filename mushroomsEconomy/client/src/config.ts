export type TWINDOW = {
    LEFT: number;
    TOP: number;
    HEIGHT: number;
    WIDTH: number;
}

export type TPoint = {
    x: number;
    y: number;
}

const CONFIG = {
    HOST: 'http://localhost:3005', // Адрес сервера
    CHAT_MAX_MESSAGE_LENGTH: 255,

    MEDIATOR: {
        EVENTS: {
            // служебные события
            SHOW_ERROR: 'SHOW_ERROR',
            SHOW_POPUP: 'SHOW_POPUP',
            // остальные события
            LOGIN: 'LOGIN',
            NEW_MESSAGE: 'NEW_MESSAGE',
            MESSAGE_LOADED: 'MESSAGE_LOADED',
            MESSAGE_SENT: 'MESSAGE_SEND',
        },
        TRIGGERS: {

            // служебные триггеры
            SET_STORE: 'SET_STORE',
            GET_STORE: 'GET_STORE',
            CLEAR_STORE: 'CLEAR_STORE',
            // остальные триггеры
            MESSAGE: 'MESSAGE:SOCKET',

            SET_MAP: "SET_MAP",
        }
    },

    SOCKET: {
        MESSAGE: 'MESSAGE',  // шлет сообщение
        MESSAGES: 'MESSAGES',
        NEW_MESSAGE: 'NEW_MESSAGE',
        TYPING: 'TYPING',    // печатает

        REGISTRATION: 'REGISTRATION',
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',

        GET_MAP: 'GET_MAP',
    },


    GRAPHICS: {
        MIN_ZOOM: 1,
        MAX_ZOOM: 45,
        ZOOM_FACTOR: 0.1,

        BORDER_PADDING: 2,

        SPRITE_SIZE: 8, // размер спрайта в пикселях
        LINE_OF_SPRITES: 110, // количество спрайтов в карте спрайтов

        WINDOW: {
            LEFT: 0,
            TOP: 0,
            HEIGHT: 700,
            WIDTH: 700,
        },
    },

};

export default CONFIG;