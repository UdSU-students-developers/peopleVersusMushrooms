interface Config {
    NAME: string;
    PORT: number;
    CORS: {
        origin: string;
    };
    DATABASE: {
        NAME: string;
    };
    MEDIATOR: {
        EVENTS: {
            GAME_START: string;  // payload: { userId: string }
            ARMY_UPDATE: string;  //  payload: { armyGuid: string, units: Unit[] }
            GAME_TICK: string;  // payload: { tick: number, timestamp: number, deltaTime: number }
            UNIT_DIED: string;  // payload: { unitId: string, armyGuid: string}
            UNIT_EXPLODED: string; // payload: { unitId: string, position: {x: number, y:number } }
        };
        TRIGGERS: {
            GET_USER_BY_GUID: string; // payload: { userGuid: string } -> returns: User 
            GET_MAP_DATA: string;  // payload: { mapId: string } -> returns: MapData
            GET_ARMY_BY_GUID: string; //payload: { armyGuid: string } -> returns: Army 

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

    MEDIATOR: {
        EVENTS: {
            GAME_START: 'GAME_START',
            ARMY_UPDATE: 'ARMY_UPDATE',
            GAME_TICK: 'GAME_TICK',
            UNIT_DIED: 'UNIT_DIED',
            UNIT_EXPLODED: 'UNIT_EXPLODED'
        },
        TRIGGERS: {
            GET_USER_BY_GUID:  'GET_USER_BY_GUID',
            GET_MAP_DATA:  'GET_MAP_DATA',
            GET_ARMY_BY_GUID:  'GET_ARMY_BY_GUID',
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
