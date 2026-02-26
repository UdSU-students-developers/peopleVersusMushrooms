class BaseManager {
    constructor (mediator, db) {
        this.mediator = mediator;
        this.db = db;

        this.EVENTS = this.mediator.getEventTypes();
        this.TRIGGERS = this.mediator.getTriggerTypes();
    }


}

module.exports = BaseManager;