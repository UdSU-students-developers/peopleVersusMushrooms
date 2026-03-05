const CONFIG = require("../../config");

class BaseManager {
    constructor(options) {
        const { mediator, db, io } = options;

        this.mediator = mediator;
        this.db = db;
        this.io = io;

        this.EVENTS = this.mediator.getEventTypes();
        this.TRIGGERS = this.mediator.getTriggerTypes();
    }


}

module.exports = BaseManager;