import { TNamesArray } from "./services/Mediator/Mediator";

interface SocketEvents {
    CONNECTION: string;
    DISCONNECT: string;
    MESSAGE_FROM_CLIENT: string;
    MESSAGE_TO_CLIENTS: string;
    REGISTRATION: string;
    LOGIN: string;
    LOGOUT: string;
    ARMY_STATE: string;
    CREATE_UNIT: string;
    SET_UNIT_TARGET: string;
}

interface MediatorEvents {
      TEST_EVENT: string;
}

interface MediatorTriggers {
    TEST_TRIGGER: string;
}

interface Config {
    SERVER_URL: string;
    SOCKET: SocketEvents;
    MEDIATOR: {
        EVENTS: TNamesArray;
        TRIGGERS: TNamesArray;
    };
}

const CONFIG: Config = {
    SERVER_URL: 'http://localhost:3007',
    
    SOCKET: {
        CONNECTION: 'connection',
        DISCONNECT: 'disconnect',
        MESSAGE_FROM_CLIENT: 'message_from_client',
        MESSAGE_TO_CLIENTS: 'message_to_clients',
        REGISTRATION: 'registration',
        LOGIN: 'login',
        LOGOUT: 'logout',
        ARMY_STATE: 'army_state',
        CREATE_UNIT: 'create_unit',
        SET_UNIT_TARGET: 'set_unit_target',

    },
    MEDIATOR: {
        EVENTS: {
            TEST_EVENT: 'TEST_EVENT',
        },
        TRIGGERS: {
            // used by client Store service
            SET_STORE: 'SET_STORE',
            GET_STORE: 'GET_STORE',
            CLEAR_STORE: 'CLEAR_STORE',

            // kept for existing experiments
            TEST_TRIGGER: 'TEST_TRIGGER',
        },
    },
};

export default CONFIG;