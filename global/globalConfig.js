const GLOBAL_CONFIG = {
    INTERVAL: 200, //мс

    MAP: {
        PORT: 3001,
        URL: 'http://localhost:3001',
        ROLE: 'spectator'
    },
    MUSHROOMS_ARMY: {
        PORT: 3003,
        URL: 'http://localhost:3003',
        ROLE: 'mushroomsArmy'
    },
    MUSHROOMS_ECONOMY: {
        PORT: 3005,
        URL: 'http://localhost:3005',
        ROLE: 'mushroomsEconomy'
    },
    PEOPLE_ARMY: {
        PORT: 3007,
        URL: 'http://localhost:3007',
        ROLE: 'peopleArmy'
    },
    PEOPLE_ECONOMY: {
        PORT: 3009,
        URL: 'http://localhost:3009',
        ROLE: 'peopleEconomy'
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
        MUSHROOMS_ECONOMY: 'mushroomsEconomy.db',
        MUSHROOMS_ARMY: 'mushroomsArmy.db',
        PEOPLE_ECONOMY: 'peopleEconomy.db',
    },


    SOCKET: {
        //lobby
        CREATE_LOBBY: 'CREATE_LOBBY',
        JOIN_TO_LOBBY: 'JOIN_TO_LOBBY',
        LEAVE_LOBBY: 'LEAVE_LOBBY',
        DROP_FROM_LOBBY: 'DROP_FROM_LOBBY',
        GET_LOBBIES: 'GET_LOBBIES',
        LOBBY_UPDATED: 'LOBBY_UPDATED',
        LOBBIES_LIST_UPDATED: 'LOBBIES_LIST_UPDATED',
        SET_READY: 'SET_READY',
        START_GAME: 'START_GAME',

        //map
        GENERATE_MAP: 'GENERATE_MAP',
        UPDATE_MAP: 'UPDATE_MAP',
        GET_MAP_PARAMS: 'GET_MAP_PARAMS',

        //user
        REGISTRATION: 'REGISTRATION',
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',
    },

    URLS: {
        //lobby
        CREATE_LOBBY: '/createLobby',
        JOIN_TO_LOBBY: '/joinToLobby',
        LEAVE_LOBBY: '/leaveLobby',
        DROP_FROM_LOBBY: '/dropFromLobby',
        GET_LOBBIES: '/getLobbies',
        LOBBY_UPDATED: '/lobbyUpdated',
        LOBBIES_LIST_UPDATED: '/lobbiesListUpdated',
        SET_READY: '/setReady',
        START_GAME: '/startGame',

        //map
        GET_RELIEF: '/getRelief',
        GET_VISIBILITY: '/getVisibility',
        GET_RESOURSE_VISIBILITY: '/getResourseVisibility',
        UPDATE_UNITS: '/updateUnits',
        UPDATE_BUILDINGS: '/updateBuldings',

        //mushrooms army
        SPAWN_UNIT: '/spawnUnit',
    },

    ROLES: {
        SPECTATOR: 'spectator',
        PEOPLE_ECONOMY: 'peopleEconomy',
        PEOPLE_ARMY: 'peopleArmy',
        MUSHROOM_ECONOMY: 'mushroomsEconomy',
        MUSHROOM_ARMY: 'mushroomsArmy',
    },

    //Mediator
    TRIGGERS: {
        TRIGGER: 'TRIGGER',
    },

    EVENTS: {
        DELETE_USER: "DELETE_USER",
    },

    UNIT_TYPES: {
        MUSHROOMS_ARMY: {
            SPOROMET: 'sporomet',
            CHAMPIGNEB: 'champigneb',
            EBLEKAR: 'eblekar',
        }
    }
};

module.exports = GLOBAL_CONFIG;