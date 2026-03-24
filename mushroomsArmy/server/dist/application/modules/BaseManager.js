"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BaseManager {
    constructor(options) {
        const { mediator, db, io, answer, common } = options;
        this.answer = answer;
        this.mediator = mediator;
        this.db = db;
        this.io = io;
        this.common = common;
        this.EVENTS = this.mediator.getEventTypes();
        this.TRIGGERS = this.mediator.getTriggerTypes();
    }
}
exports.default = BaseManager;
//# sourceMappingURL=BaseManager.js.map