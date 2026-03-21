const CONFIG = require("../../config");

class BaseManager {
    constructor({ mediator, db, common, io, answer }) {
        this.db = db;
        this.mediator = mediator;
        this.common = common;
        this.io = io;
        this.answer = answer; 
        this.EVENTS = mediator.getEventTypes();
        this.TRIGGERS = mediator.getTriggerTypes();
        this.MESSAGES = CONFIG.MESSAGES;
    }
}

module.exports = BaseManager;