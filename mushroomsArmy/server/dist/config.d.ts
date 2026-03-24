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
declare const CONFIG: Config;
export default CONFIG;
