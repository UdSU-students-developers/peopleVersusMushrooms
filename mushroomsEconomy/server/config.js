const CONFIG = {
    NAME: 'Mushroom economy server',
    PORT: 3005,
    CORS: {
        origin: "*",
    },

    DATABASE: {
        NAME: 'data.db',
    },

    MEDIATOR: {
        EVENTS: {
            EXAMPLE_EVENT: "EXAMPLE_EVENT",
			
			START_GAME: 'START_GAME',
        },
        TRIGGERS: {
            EXAMPLE_TRIGGER: "EXAMPLE_TRIGGER",
            GET_USER_BY_GUID: 'GET_USER_BY_GUID',
        },
    },

    SOCKET: {
        MESSAGE: 'MESSAGE',  // шлет сообщение
        MESSAGES: 'MESSAGES',
        NEW_MESSAGE: 'NEW_MESSAGE',
        TYPING: 'TYPING',           // печатает

        REGISTRATION: 'REGISTRATION',
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',

        CREATE_ROOM: 'CREATE_ROOM',
        DELETE_ROOM: 'DELETE_ROOM',
        JOIN_ROOM: 'JOIN_ROOM',
        LEAVE_ROOM: 'LEAVE_ROOM',
        KICK_USER: 'KICK_USER',
        DROP_FROM_ROOM: 'DROP_FROM_ROOM',
        GET_ROOMS: 'GET_ROOMS',
 
        START_GAME: 'START_GAME',
		UPDATE_SCENE: 'UPDATE_SCENE',
    },
    
    ECONOMY: {
        INTERVAL: 200, //ms

        MAP: {
            GRASS: 0,
            WATER: 1,
            STONE: 2,
        },

        MYCELIUM: {
            HP: 1,
            GROW_SPEED: 100,
            GROW_LEVEL_UP: 2000,
            MAX_LEVEL: 3,
            POWER: 3,
        }
    }
};

module.exports = CONFIG;