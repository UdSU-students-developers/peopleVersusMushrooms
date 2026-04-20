interface Config {
    NAME: string;
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
        };
    };
    SOCKET: {
        LOBBY_START: string;
        GAME_STATE: string;
        GAME_OVER: string;
    };
}

const CONFIG: Config = {
    NAME: 'MUSHROOMS ARMY SERVER',
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
        },
    },

    SOCKET: {
        LOBBY_START: 'lobby:start',
        GAME_STATE: 'game:state',
        GAME_OVER: 'game:over',
    },
};

export default CONFIG;