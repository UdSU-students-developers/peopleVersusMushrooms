export type TEvent = { [key: string]: string };

type TMediatorConfig = {
    EVENTS: TEvent;
    TRIGGERS: TEvent;
};

class Mediator {
    private events: { [key: string]: Function[] };
    private triggers: { [key: string]: Function };
    private EVENTS: TEvent;
    private TRIGGERS: TEvent;

    constructor({ EVENTS, TRIGGERS }: TMediatorConfig) {
        this.events = {};
        this.triggers = {};
        this.EVENTS = EVENTS;
        this.TRIGGERS = TRIGGERS;
        Object.keys(this.EVENTS).forEach(key => this.events[this.EVENTS[key]] = []);
        Object.keys(this.TRIGGERS).forEach(key => this.triggers[this.TRIGGERS[key]] = () => { return null; });
    }

    getEventTypes(): { [key: string]: string } {
        return this.EVENTS;
    }

    subscribe(name: string, func: Function): void {
        if (this.events[name] && func instanceof Function) {
            this.events[name].push(func);
        }
    }

    unsubscribe(name: string, _func: Function): void {
        if (!(this.events[name] && _func instanceof Function)) {
            return;
        }
        const handlerEntries = this.events[name]
            .map((func, i) => ([func, i] as [Function, number]))
            .filter(([func]) => func === _func);
        if (handlerEntries.length > 0) {
            const [, index] = handlerEntries[0];
            this.events[name].splice(index, 1);
        }
    }

    unsubscribeAll(name: string): void {
        if (name && this.events[name]) {
            this.events[name] = [];
        }
    }

    call(name: string, data?: unknown): void {
        if (this.events[name]) {
            this.events[name].forEach(event => {
                if (event instanceof Function) {
                    event(data);
                }
            });
        }
    }

    getTriggerTypes(): { [key: string]: string } {
        return this.TRIGGERS;
    }

    set(name: string, func: Function): void {
        if (name && func instanceof Function) {
            this.triggers[name] = func;
        }
    }

    get<T, K = undefined>(name: string, data?: K): T | null {
        return (this.triggers[name] && this.triggers[name] instanceof Function) ? this.triggers[name](data) : null;
    }
}

export default Mediator;