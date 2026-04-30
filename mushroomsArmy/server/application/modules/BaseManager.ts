import { Server as SocketIOServer } from 'socket.io';
import Common from './common/Common';

const GLOBAL_CONFIG = require('../../../../global/globalConfig');

type TAnswer = {
    good: (data: unknown) => unknown;
    bad: (code: number) => unknown;
};

type TMediator = {
    subscribe: (event: string, callback: (data: unknown) => void) => void;
    call: (event: string, data?: unknown) => unknown;
    set: (trigger: string, callback: (data: unknown) => unknown) => void;
    get: (trigger: string, data?: unknown) => unknown;
    getEventTypes: () => { [key: string]: string };
    getTriggerTypes: () => { [key: string]: string };
};

type TDB = object;

export type TManagerOptions = {
    mediator: TMediator;
    db: TDB;
    io: SocketIOServer;
    answer: TAnswer;
    common: Common;
}

type TApiResponse = {
    result: string;
    data: unknown;
};

class BaseManager {
    protected answer: TAnswer;
    protected mediator: TMediator;
    protected db: TDB;
    protected io: SocketIOServer;
    protected common: Common;
    protected EVENTS: { [key: string]: string };
    protected TRIGGERS: { [key: string]: string };

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
            const params: RequestInit = {
                method,
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
            };

            if (data) {
                params.body = JSON.stringify(data);
            }

            const res = await fetch(url, params);
            const answer = await res.json() as TApiResponse;

            if (answer && answer.result === 'ok') {
                return answer.data as K;
            }

            return null;
        } catch (error) {
            console.error(`[BaseManager] Ошибка запроса к ${url}:`, error);
            return null;
        }
    }

    sendToMap<K = undefined>(
        urlPath: string,
        mapGuid: string,
        armyGuid: string,
        data: Record<string, unknown> | null = null,
    ): Promise<K | null> {
        return this.send<Record<string, unknown>, K>(
            `${GLOBAL_CONFIG.MAP.URL}${urlPath}`,
            { mapGuid, userGuid: armyGuid, ...(data as Record<string, unknown> ?? {}) },
        );
    }

    sendToMushroomsEconomy<T, K = undefined>(
        urlPath: string,
        data: T | null = null
    ): Promise<K | null> {
        return this.send(`${GLOBAL_CONFIG.MUSHROOMS_ECONOMY.URL}${urlPath}`, data);
    }

}

export default BaseManager;