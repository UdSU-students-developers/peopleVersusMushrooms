import { Server as SocketIOServer } from 'socket.io';
import Mediator, { TEvent } from './Mediator';
import DB from './db/DB';
import Answer, { TResponse } from '../Answer';
import Common from './common/Common';

export type TManagerOptions = {
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
    protected EVENTS: TEvent;
    protected TRIGGERS: TEvent;

    constructor(options: TManagerOptions) {
        const { mediator, db, io, answer, common } = options;

        this.answer = answer;
        this.mediator = mediator;
        this.db = db;
        this.io = io;
        this.common = common;

        this.EVENTS = this.mediator.getEventTypes();
        this.TRIGGERS = this.mediator.getTriggerTypes();
    }

    async send<T, K = undefined>(
        url: string, 
        data: T | null = null, 
        method = 'POST'
    ): Promise<K | null> {
        try {
            const params = {
                method,
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
            }
            if (data) {
                // @ts-ignore
                params.body = JSON.stringify(data);
            }
            const res = await fetch(url, params);
            const answer = await res.json() as TResponse<K>;
            if (answer.result === 'ok') {
                return answer.data;
            } 
            if (answer.result === 'error') {
                // обработать ошибку (записывать в БД)
            }
            return null;
        } catch (error) {
            console.log(error);
            // обработать ошибку тоже (записывать в БД)
            return null;
        }
    }

    sendToMap<T, K = undefined>(
        urlPath: string, 
        mapGuid: string,
        armyGuid: string,
        data: T | null = null
    ): Promise<K | null> {
        return this.send(
            `http://localhost:3001${urlPath}/${mapGuid}/${armyGuid}`,
            data,
        )
    }
}

export default BaseManager;