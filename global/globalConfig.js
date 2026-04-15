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

    DATABASES: {
        MUSHROOMS_ECONOMY: 'data.db',
        PEOPLE_ECONOMY: 'peopleEconomy.db',
    },


    SOCKET: {
        //lobby
        CREATE_LOBBY: 'CREATE_LOBBY',
        JOIN_TO_LOBBY: 'JOIN_TO_LOBBY',
        LEAVE_LOBBY: 'LEAVE_LOBBY',
        DROP_FROM_LOBBY: 'DROP_FROM_LOBBY',
        GET_LOBBIES: 'GET_LOBBYS',
        LOBBY_UPDATED: 'LOBBY_UPDATED',
        LOBBIES_LIST_UPDATED: 'LOBBYS_LIST_UPDATED',
        SET_READY: 'SET_READY',
        START_GAME: 'START_GAME',

        //user
        REGISTRATION: 'REGISTRATION',
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',
    },

    URLS: {
        CREATE_LOBBY: '/createLobby',
        JOIN_TO_LOBBY: '/joinToLobby',
        LEAVE_LOBBY: '/leaveLobby',
        DROP_FROM_LOBBY: '/dropFromLobby',
        GET_LOBBIES: '/getLobbies',
        LOBBY_UPDATED: '/lobbyUpdated',
        LOBBIES_LIST_UPDATED: '/lobbiesListUpdated',
        SET_READY: '/setReady',
        START_GAME: '/startGame',

        GET_RELIEF: '/getRelief',
        GET_VISIBILITY: '/getVisibility',
        GET_RESOURSE_VISIBILITY: '/getResourseVisibility',
        UPDATE_UNITS_HANDLER: 'updateUnitsHandler',
        UPDATE_BUILDINGS_HANDLER: 'updateBuldingsHandler'
    }
};

module.exports = GLOBAL_CONFIG;