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

        REGISTRATION: 'REGISTRATION',
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',

        GET_MAP: 'GET_MAP',
    },
    
    ECONOMY: {
        INTERVAL: 200, //ms

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