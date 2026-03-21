class BaseManager {
    constructor ({ mediator, db, io, common }) {
        this.db = db;
		this.io = io;
        this.mediator = mediator;
		this.common = common;

        this.EVENTS = this.mediator.getEventTypes();
        this.TRIGGERS = this.mediator.getTriggerTypes();
    }
}

module.exports = BaseManager;