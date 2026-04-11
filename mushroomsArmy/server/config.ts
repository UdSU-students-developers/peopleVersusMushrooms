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
    };
    MEDIATOR: {
        EVENTS: {
            START_GAME: string;  // payload: { guid: string, map: number[][], buildings: TBuilding[], mapGuid: string }
            ARMY_UPDATE: string;  // payload: { armyGuid: string, units: Unit[] }
            UNIT_DIED: string;  // payload: { unitId: string, armyGuid: string }
            UNIT_EXPLODED: string; // payload: { unitId: string, position: {x: number, y: number} }
        };
        TRIGGERS: {
            GET_USER_BY_GUID: string; // payload: guid -> returns: User
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
    },

    MEDIATOR: {
        EVENTS: {
            START_GAME: 'START_GAME',
            ARMY_UPDATE: 'ARMY_UPDATE',
            UNIT_DIED: 'UNIT_DIED',
            UNIT_EXPLODED: 'UNIT_EXPLODED'
        },
        TRIGGERS: {
            GET_USER_BY_GUID: 'GET_USER_BY_GUID',
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
