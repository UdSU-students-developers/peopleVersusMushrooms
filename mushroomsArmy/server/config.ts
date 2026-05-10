interface Config {
    NAME: string;
    ROLE: string;
    PORT: number;
    MEDIATOR: {
        EVENTS: {
            DELETE_USER: string;
            LOBBY_UPDATED: string;
            START_GAME: string;
        };
        TRIGGERS: {
            GET_USER_BY_GUID: string;
            GET_USER_BY_SOCKET_ID: string;
            TAKE_DAMAGE_HANDLER: string;
            DESTROY_ARMY: string;
            MOVE_UNIT: string;
            GET_ARMY: string;
            SPAWN_UNIT: string;
            SPAWN_BUILDING: string;
            UPDATE_ECONOMY_BUILDINGS: string;
        };
    };
    SOCKET: {
        LOBBY_START: string;
        GAME_STARTED: string;
        GAME_STATE: string;
        GAME_OVER: string;
        SPAWN_UNIT: string;
    };
}

const CONFIG: Config = {
    NAME: 'MUSHROOMS ARMY SERVER',
    ROLE: 'mushroomsArmy',
    PORT: 3003,

    MEDIATOR: {
        EVENTS: {
            DELETE_USER: 'DELETE_USER',
            LOBBY_UPDATED: 'LOBBY_UPDATED',
            START_GAME: 'START_GAME',
        },
        TRIGGERS: {
            GET_USER_BY_GUID: 'GET_USER_BY_GUID',
            GET_USER_BY_SOCKET_ID: 'GET_USER_BY_SOCKET_ID',
            TAKE_DAMAGE_HANDLER: 'TAKE_DAMAGE_HANDLER',
            DESTROY_ARMY: 'DESTROY_ARMY',
            MOVE_UNIT: 'MOVE_UNIT',
            GET_ARMY: 'GET_ARMY',
            SPAWN_UNIT: 'SPAWN_UNIT',
            SPAWN_BUILDING: 'SPAWN_BUILDING',
            UPDATE_ECONOMY_BUILDINGS: 'UPDATE_ECONOMY_BUILDINGS',
        },
    },

    SOCKET: {
        LOBBY_START: 'lobby:start',
        GAME_STARTED: 'game:started',
        GAME_STATE: 'game:state',
        GAME_OVER: 'game:over',
        SPAWN_UNIT: 'game:spawn_unit',
    },
};

export default CONFIG;