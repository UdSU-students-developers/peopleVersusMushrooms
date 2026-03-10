const CONFIG = require("../../config");

class BaseManager {
    constructor(options) {
        const { mediator, db, io, answer } = options;

        this.answer = answer;
        this.mediator = mediator;
        this.db = db;
        this.io = io;

        this.EVENTS = this.mediator.getEventTypes();
        this.TRIGGERS = this.mediator.getTriggerTypes();
    }


}

module.exports = BaseManager;