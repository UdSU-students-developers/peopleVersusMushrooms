class BaseManager {
    constructor({ mediator, db, common, answer, io }) {
        this.db = db;
        this.mediator = mediator;
        this.common = common;
        this.answer = answer;
        this.io = io;
        this.EVENTS = mediator.getEventTypes();
        this.TRIGGERS = mediator.getTriggerTypes();
    }
}

module.exports = BaseManager;