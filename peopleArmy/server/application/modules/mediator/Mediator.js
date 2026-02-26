class Mediator {
    constructor({ EVENTS, TRIGGERS }) {
        this.events = {};
        this.triggers = {};
        this.EVENTS = EVENTS;
        this.TRIGGERS = TRIGGERS;
        Object.keys(this.EVENTS  ).forEach(key => this.events[this.EVENTS[key]] = []);
        Object.keys(this.TRIGGERS).forEach(key => this.triggers[this.TRIGGERS[key]] = () => { return null; });
    }

    getEventTypes() {
        return this.EVENTS;
    }

    subscribe(name, func) {
        if (this.events[name] & func instanceof Function) {
            this.events[name].push(func);
        }
    }

    unsubscribe(name, _func) {
        if (!(this.events[name] && _func instanceof Function)) {
            return;
        }
        const handlerEntry = this.events[name]
            .map((func, i) => ([func, i]))
            .filter(([func]) => func === _func)[0];
        if (handlerEntry) {
            this.events[name].splice(handlerEntry[1], 1);
        }
    }

    unsubscribeAll(name) {
        if (name && this.events[name]) {
            this.events[name] = [];
        }
    }

    call(name, data) {
        if (this.events[name]) {
            this.events[name].forEach(event => {
                if (event instanceof Function) { 
                    event(data);
                }
            });
        }
    }

    getTriggerTypes() {
        return this.TRIGGERS;
    }

    set(name, func) {
        if (name && func instanceof Function) {
            this.triggers[name] = func;
        }
    }

    get(name, data) {
        return (this.triggers[name] && this.triggers[name] instanceof Function) ? this.triggers[name](data) : null;
    }
}
module.exports = Mediator;