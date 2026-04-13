const GLOBAL_CONFIG = {
    MAP: {
        URL: 'http://localhost:3001',
    },
    MUSHROOMS_ARMY: {
        URL: 'http://localhost:3003',
    },
    MUSHROOMS_ECONOMY: {
        URL: 'http://localhost:3005',
    },
    PEOPLE_ARMY: {
        URL: 'http://localhost:3007',
    },
    PEOPLE_ECONOMY: {
        URL: 'http://localhost:3009',
    },

    CORS: { //Подключается через app.use()
        origin: "*",
        middleware: (_, res, next) => {
            res.header('Content-Type', 'application/json; charset=utf-8');
            res.header('Access-Control-Allow-Origin', '*');
            next();
        }
    },

    DATABASE: {
        NAME: 'data.db',
    },


    SOCKET: {
        CREATE_LOBBY: 'CREATE_LOBBY',
        JOIN_TO_LOBBY: 'JOIN_TO_LOBBY',
        LEAVE_LOBBY: 'LEAVE_LOBBY',
        DROP_FROM_LOBBY: 'DROP_FROM_LOBBY',
        GET_LOBBIES: 'GET_LOBBYS',
        LOBBY_UPDATED: 'LOBBY_UPDATED',
        LOBBIES_LIST_UPDATED: 'LOBBYS_LIST_UPDATED',
        SET_READY: 'SET_READY',
        START_GAME: 'START_GAME',
    },
};

module.exports = GLOBAL_CONFIG;