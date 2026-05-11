const CONFIG = {
    NAME: 'PEOPLE ECONOMY SERVER',
    PORT: 3009,

    MEDIATOR: {
        EVENTS: {
            DELETE_USER: "DELETE_USER",

            LOBBY_UPDATED: 'LOBBY_UPDATED',
            START_GAME: 'START_GAME',

            
        },
        TRIGGERS: {
            GET_USER_BY_GUID: 'GET_USER_BY_GUID',
            GET_USER_BY_SOCKET_ID: 'GET_USER_BY_SOCKET_ID',
        },
    },

    SOCKET: {
        MESSAGE: 'MESSAGE',  // шлет сообщение
        MESSAGES: 'MESSAGES',
        NEW_MESSAGE: 'NEW_MESSAGE',
        TYPING: 'TYPING',           // печатает
        
        UPDATE_SCENE: 'UPDATE_SCENE',
        GET_SCENE: 'GET_SCENE',
    },

    ECONOMY: {
        INTERVAL: 200, //ms (единица времени)

        MINE: {

        },
        STORAGE_IRON: {

        },
        STORAGE_FAT: {

        },
        UNIT: {
            RADIUS: 10, //максимальный радиус расчета ближайшей точки от центра стремления(больше 20 не ставить)
        },
        WORKER: {
            HP: 150,
            SPEED: 2,
            TYPE: "worker",
            VISIBILITY: 3,
        },

        BUILDINGS: {
            PIPE: 'PIPE',
            BARRACKS: 'BARRACKS',
            SMALL_GENERATOR: 'SMALL_GENERATOR',
            DRILLER: 'DRILLER',
        }
    }
};

module.exports = CONFIG;