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

    MEDIATOR: {
        EVENTS: {
            LOGIN: 'LOGIN',
        },
        TRIGGERS: {
            MESSAGE: 'MESSAGE:SOCKET',

            SET_STORE: 'SET_STORE',
            GET_STORE: 'GET_STORE',
            CLEAR_STORE: 'CLEAR_STORE',

            ERROR: "ERROR",
        }
    },

    SOCKET: {
        MESSAGE: 'MESSAGE',  // шлет сообщение
        TYPING: 'TYPING',    // печатает

        REGISTRATION: 'REGISTRATION',
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',
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