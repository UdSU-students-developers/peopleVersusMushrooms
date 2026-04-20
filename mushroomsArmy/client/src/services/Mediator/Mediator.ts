export type TNamesArray = {
    [key: string]: string,
}

export type TMediator = {
    EVENTS: TNamesArray,
    TRIGGERS: TNamesArray,
}

class Mediator {
    private events: { [key: string]: Function[] } = {}; // about events
    private triggers: { [key: string]: Function } = {}; // about triggers
    private EVENTS: TNamesArray;
    private TRIGGERS: TNamesArray;

    constructor(options: TMediator) {
        const { EVENTS = {}, TRIGGERS = {} } = options;
        this.EVENTS   = EVENTS;
        this.TRIGGERS = TRIGGERS;
        // init events and triggers
        Object.keys(this.EVENTS  ).forEach(key => this.events[this.EVENTS[key]] = []);
        Object.keys(this.TRIGGERS).forEach(key => this.triggers[this.TRIGGERS[key]] = () => { return null; });
    }

    /**********/
    /* EVENTS */
    /**********/
    // get event types
    getEventTypes(): TNamesArray {
        return this.EVENTS;
    }

    // subscribe event
    subscribe(name: string, func: Function): void {
        if (this.events[name] && func instanceof Function) {
            this.events[name].push(func);
        }
    }

    unsubscribe(name: string, _func: Function): void {
        if (!(this.events[name] && _func instanceof Function)) {
            return;
        }
        const handlerEntry = this.events[name]
            .map((func, i) => ([func, i]))
            .filter(([func]) => func === _func)[0];
        if (handlerEntry) {
            this.events[name].splice(handlerEntry[1] as number, 1);
        }
    }

    unsubscribeAll(name: string): void {
        if (name && this.events[name]) {
            this.events[name] = [];
        }
    }

    // call event
    call(name: string, data?: unknown): void {
        if (this.events[name]) {
            this.events[name].forEach(event => {
                if (event instanceof Function) { 
                    event(data);
                }
            });
        }
    }

    /************/
    /* TRIGGERS */
    /************/
    // get trigger types
    getTriggerTypes(): TNamesArray {
        return this.TRIGGERS;
    }

    // set trigger
    set(name: string, func: Function): void {
        if (name && func instanceof Function) {
            this.triggers[name] = func;
        }
    }

    // get trigger value
    get<T>(name: string, data?: unknown): T | null {
        return (this.triggers[name] && this.triggers[name] instanceof Function) ? this.triggers[name](data) : null;
    }
}

export default Mediator;