interface Config {
    NAME: string;
    PORT: number;
    CORS: {
        origin: string;
    };
    DATABASE: {
        NAME: string;
    };
    SERVICES: {
        MAP_URL: string;
        PEOPLE_ARMY_URL: string;
        PEOPLE_ECONOMY_URL: string;
        MUSHROOMS_ECONOMY_URL: string;
    };
    MEDIATOR: {
        EVENTS: {
            START_GAME: string;
        };
        TRIGGERS: {
            GET_USER_BY_GUID: string;
            TAKE_DAMAGE_HANDLER: string;
            DESTROY_ARMY: string;
        };
    };
    SOCKET: {
        REGISTRATION: string;
        LOGIN: string;
        LOGOUT: string;
        LOBBY_START: string;
        VALIDATE_TOKEN: string;
        GAME_STATE: string;      
        GAME_OVER: string; 
    };
}

const CONFIG: Config = {
    NAME: 'Mushroom Army server',
    PORT: 3003,
    CORS: {
        origin: "*",
    },

    DATABASE: {
        NAME: 'mushroomsArmy.db',
    },

    SERVICES: {
        MAP_URL: 'http://localhost:3001',
        PEOPLE_ARMY_URL: 'http://localhost:3007',
        PEOPLE_ECONOMY_URL: 'http://localhost:3009',
        MUSHROOMS_ECONOMY_URL: 'http://localhost:3005',
    },

    MEDIATOR: {
        EVENTS: {
            START_GAME: 'START_GAME',
        },
        TRIGGERS: {
            GET_USER_BY_GUID: 'GET_USER_BY_GUID',
            TAKE_DAMAGE_HANDLER: 'TAKE_DAMAGE_HANDLER',
            DESTROY_ARMY: 'DESTROY_ARMY',
        },
    },
    SOCKET: {
        REGISTRATION: 'registration',
        LOGIN: 'login',
        LOGOUT: 'logout',
        LOBBY_START: 'lobby:start',
        VALIDATE_TOKEN: 'auth:validate',
        GAME_STATE: 'game:state',    
        GAME_OVER: 'game:over' 
    }
};

export default CONFIG;