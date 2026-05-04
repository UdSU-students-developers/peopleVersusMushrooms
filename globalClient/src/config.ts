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

/** Роль клиента Global; URL бэкенда — в HOST_BY_ROLE. */
export type GameRole =
    | 'map'
    | 'mushroomsArmy'
    | 'mushroomsEconomy'
    | 'peopleArmy'
    | 'peopleEconomy';

const CONFIG = {
    /** Адрес сокет-сервера для каждой роли (совпадает с global/globalConfig.js). */
    HOST_BY_ROLE: {
        map: 'http://localhost:3001',
        mushroomsArmy: 'http://localhost:3003',
        mushroomsEconomy: 'http://localhost:3005',
        peopleArmy: 'http://localhost:3007',
        peopleEconomy: 'http://localhost:3009',
    } satisfies Record<GameRole, string>,

    CHAT_MAX_MESSAGE_LENGTH: 255,

    MEDIATOR: {
        EVENTS: {
            // служебные события
            SHOW_ERROR: 'SHOW_ERROR',
            SHOW_POPUP: 'SHOW_POPUP',
            // остальные события
            MESSAGE_LOADED: 'MESSAGE_LOADED',
            MESSAGE_SENT: 'MESSAGE_SEND',
            // игра
            START_GAME: 'START_GAME',
            UPDATE_SCENE: 'UPDATE_SCENE',
            LOBBY_UPDATED: 'LOBBY_UPDATED',
            LOBBIES_LIST_UPDATED: 'LOBBIES_LIST_UPDATED',
            RELIEF_LOADED: 'RELIEF_LOADED',
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
        JOIN_TO_LOBBY: 'JOIN_TO_LOBBY',
        LEAVE_LOBBY: 'LEAVE_LOBBY',
        DROP_FROM_LOBBY: 'DROP_FROM_LOBBY',
        START_GAME: 'START_GAME',
        GET_LOBBIES: 'GET_LOBBIES',
        LOBBY_UPDATED: 'LOBBY_UPDATED',
        LOBBIES_LIST_UPDATED: 'LOBBIES_LIST_UPDATED',
        SET_READY: 'SET_READY',

        RELIEF_LOADED: 'RELIEF_LOADED',

        UPDATE_SCENE: 'UPDATE_SCENE',
        GET_SCENE: 'GET_SCENE',
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