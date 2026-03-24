"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CONFIG = {
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
exports.default = CONFIG;
//# sourceMappingURL=config.js.map