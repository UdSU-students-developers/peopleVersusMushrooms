const CONFIG = {
    NAME: 'Mushroom economy server',
    PORT: 3005,

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

    CORS: {
        origin: "*",
    },

    SOCKET: {
        LOGIN: 'login',
        MESSAGE: 'message',
        TYPING: 'typing',

        CREATE_ROOM: 'create_room',
        DELETE_ROOM: 'delete_room',
        JOIN_ROOM: 'join_room',
        LEAVE_ROOM: 'leave_room',
        KICK_USER: 'kick_user',
        
        ROOM_LIST: 'room_list',      
        ROOM_UPDATE: 'room_update',
        ERROR: 'error', 
    },
};

module.exports = CONFIG;