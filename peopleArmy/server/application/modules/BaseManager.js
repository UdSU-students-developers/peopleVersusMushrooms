const CONFIG = require("../../config");

class BaseManager {
    constructor ({ mediator, db, io, common, answer }) {
        this.db = db;
		this.io = io;
        this.mediator = mediator;
		this.common = common;
        this.answer = answer;

        this.EVENTS = this.mediator.getEventTypes();
        this.TRIGGERS = this.mediator.getTriggerTypes();
        this.SOCKETS = CONFIG.SOCKETS;
    }
}

module.exports = BaseManager;