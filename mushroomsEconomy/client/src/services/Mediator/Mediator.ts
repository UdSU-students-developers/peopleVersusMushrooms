export type TNamesArray = {
    [key: string]: string,
}

export type TMediator = {
    EVENTS: TNamesArray,
    TRIGGERS: TNamesArray,
}

class Mediator {
    private events: { [key: string]: Function[] } = {}; 
    private triggers: { [key: string]: Function } = {}; 
    private EVENTS: TNamesArray;
    private TRIGGERS: TNamesArray;

    constructor({ EVENTS = {}, TRIGGERS = {} }: TMediator) {
        this.EVENTS   = EVENTS;
        this.TRIGGERS = TRIGGERS;
        
        Object.keys(this.EVENTS).forEach(key => this.events[this.EVENTS[key]] = []);
        Object.keys(this.TRIGGERS).forEach(key => this.triggers[this.TRIGGERS[key]] = () => { return null; });
    }

    /**********/
    /* EVENTS */
    /**********/
    getEventTypes(): TNamesArray {
        return this.EVENTS;
    }

    subscribe(name: string, func: (a: any) => any): void {
        if (this.events[name] && func instanceof Function) {
            this.events[name].push(func);
        }
    }

    unsubscribe(name: string, _func: (a: any) => any): void {
        if (!(this.events[name] && _func instanceof Function)) return;
        const handlerEntry = this.events[name]
            .map((func, i) => ([func, i]))
            .filter(([func]) => func === _func)[0];
        if (handlerEntry) {
            this.events[name].splice(handlerEntry[1] as number, 1);
        }
    }

    unsubscribeAll(name: string): void {
        if (name && this.events[name]) this.events[name] = [];
    }

    call(name: string, data?: any): void {
        if (this.events[name]) {
            this.events[name].forEach(event => {
                if (event instanceof Function) event(data);
            });
        }
    }

    /************/
    /* TRIGGERS */
    /************/
    getTriggerTypes(): TNamesArray {
        return this.TRIGGERS;
    }

    set(name: string, func: (a: any) => any): void {
        if (name && func instanceof Function) this.triggers[name] = func;
    }

    get<T>(name: string, data?: any): T | null {
        return (this.triggers[name] && this.triggers[name] instanceof Function) ? this.triggers[name](data) : null;
    }
}

export default Mediator;