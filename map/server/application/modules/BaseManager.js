class BaseManager {
    constructor({ mediator, db, io }) {
        this.db = db;
        this.mediator = mediator;
        this.io = io;
        this.EVENTS = mediator.getEventTypes();
        this.TRIGGERS = mediator.getTriggerTypes();
    }
}

module.exports = BaseManager;