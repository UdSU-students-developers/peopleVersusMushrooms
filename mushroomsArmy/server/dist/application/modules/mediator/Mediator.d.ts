interface MediatorConfig {
    EVENTS: {
        [key: string]: string;
    };
    TRIGGERS: {
        [key: string]: string;
    };
}
declare class Mediator {
    private events;
    private triggers;
    private EVENTS;
    private TRIGGERS;
    constructor({ EVENTS, TRIGGERS }: MediatorConfig);
    getEventTypes(): {
        [key: string]: string;
    };
    subscribe(name: string, func: Function): void;
    unsubscribe(name: string, _func: Function): void;
    unsubscribeAll(name: string): void;
    call(name: string, data?: any): void;
    getTriggerTypes(): {
        [key: string]: string;
    };
    set(name: string, func: Function): void;
    get(name: string, data?: any): any;
}
export default Mediator;
