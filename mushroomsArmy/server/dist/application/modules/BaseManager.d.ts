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
declare class BaseManager {
    protected answer: Answer;
    protected mediator: Mediator;
    protected db: DB;
    protected io: SocketIOServer;
    protected common: Common;
    protected EVENTS: any;
    protected TRIGGERS: any;
    constructor(options: BaseManagerOptions);
}
export default BaseManager;
