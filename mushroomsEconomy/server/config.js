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
        LOGIN: 'login',
        MESSAGE: 'message',
        TYPING: 'typing',
    },
    
    ECONOMY: {
        INTERVAL: 200, //ms
    }
};

module.exports = CONFIG;