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

        }
    },

    SOCKET: {
        MESSAGE: 'MESSAGE',  // шлет сообщение
        MESSAGES: 'MESSAGES',
        NEW_MESSAGE: 'NEW_MESSAGE',
        TYPING: 'TYPING',           // печатает

        REGISTRATION: 'REGISTRATION',
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',

        CREATE_LOBBY: 'CREATE_LOBBY',
        DELETE_LOBBY: 'DELETE_LOBBY',
        JOIN_LOBBY: 'JOIN_LOBBY',
        LEAVE_LOBBY: 'LEAVE_LOBBY',
 
        START_GAME: 'START_GAME',
		UPDATE_SCENE: 'UPDATE_SCENE',
    },


    GRAPHICS: {
        MIN_ZOOM: 100,
        MAX_ZOOM: 45000,
        ZOOM_FACTOR: 0.1,

        BORDER_PADDING: 2,

        SPRITE_SIZE: 32, // размер спрайта в пикселях
        LINE_OF_SPRITES: 32, // количество ЛИНИЙ спрайтов в карте спрайтов

        WINDOW: {
            LEFT: 0,
            TOP: 0,
            HEIGHT: 700,
            WIDTH: 700,
        },

        MAP: {
            GRASS: 0,
            WATER: 1,
            STONE: 2,
        },
    },

};

export default CONFIG;