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
        },
        TRIGGERS: {
            EXAMPLE_TRIGGER: "EXAMPLE_TRIGGER",

            // Mushrooms
            GET_ALL_MUSHROOMS: "GET_ALL_MUSHROOMS",
            CREATE_MUSHROOM: "CREATE_MUSHROOM",
            UPDATE_MUSHROOM: "UPDATE_MUSHROOM",
            DELETE_MUSHROOM: "DELETE_MUSHROOM",

            // Units
            GET_ALL_UNITS: "GET_ALL_UNITS",
            CREATE_UNIT: "CREATE_UNIT",
            UPDATE_UNIT: "UPDATE_UNIT",
            DELETE_UNIT: "DELETE_UNIT",

            // Matrix
            UPDATE_MATRIX: "UPDATE_MATRIX",
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
 
        ERROR: 'ERROR',
        GET_MAP: 'GET_MAP',
    },
    
    ECONOMY: {
        INTERVAL: 200, //ms
        MAX_ATTEMPTS: 10, // Для юнитов количество повторений при застревании 
        MYCELIUM: {
            HP: 1,
            GROW_SPEED: 100,
            GROW_LEVEL_UP: 2,
            MAX_LEVEL: 3,
            POWER: 3,
        },

        WORKER: {
            HP: 1,
            SPEED: 100,

        },
    }
};

module.exports = CONFIG;