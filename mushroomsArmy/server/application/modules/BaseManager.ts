import { Server as SocketIOServer } from 'socket.io';
import Mediator from './mediator/Mediator';
import DB from './db/DB';
import Answer from '../Answer';
import Common from './common/Common';

interface BaseManagerOptions {
    mediator: Mediator;
    db: DB;
    io: SocketIOServer;
    answer: Answer;
    common: Common;
}

class BaseManager {
    protected answer: Answer;
    protected mediator: Mediator;
    protected db: DB;
    protected io: SocketIOServer;
    protected common: Common;
    protected EVENTS: any;
    protected TRIGGERS: any;

    constructor(options: BaseManagerOptions) {
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

export default BaseManager;