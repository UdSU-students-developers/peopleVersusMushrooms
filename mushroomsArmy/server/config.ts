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
            EXAMPLE_EVENT: string;
        };
        TRIGGERS: {
            EXAMPLE_TRIGGER: string;
        };
    };
    SOCKET: {
        REGISTRATION: string;
        LOGIN: string;
        LOGOUT: string;
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
            EXAMPLE_EVENT: "EXAMPLE_EVENT",
        },
        TRIGGERS: {
            EXAMPLE_TRIGGER: "EXAMPLE_TRIGGER",
        },
    },
    SOCKET: {
        REGISTRATION: 'registration',
        LOGIN: 'login',
        LOGOUT: 'logout'
    }
};

export default CONFIG;