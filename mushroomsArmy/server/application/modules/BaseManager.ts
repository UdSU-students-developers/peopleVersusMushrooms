import { Server as SocketIOServer } from 'socket.io';
import Mediator, { TEvent } from './Mediator';
import DB from './db/DB';
import Answer, { TResponse } from '../Answer';
import Common from './common/Common';
import CONFIG from '../../config';

export type TManagerOptions = {
    mediator: Mediator;
    db: DB;
    io: SocketIOServer;
    answer: Answer;
    common: Common;
}

type TServiceError = {
    code: number;
    text: string;
};

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
            const answer = await res.json() as TResponse<K>;

            if (answer.result === 'ok') {
                return answer.data;
            }

            if (answer.result === 'error') {
                await this.logErrorToDB(url, answer.error);
            }

            return null;
        } catch (error) {
            console.error(`[BaseManager] Ошибка запроса к ${url}:`, error);

            await this.logErrorToDB(url, {
                code: 9000,
                text: error instanceof Error ? error.message : 'Unknown send error',
            });

            return null;
        }
    }

    /** Записывает ошибку в базу данных */
    private async logErrorToDB(url: string, error: unknown): Promise<void> {
        try {
            if (
                typeof error === 'object' &&
                error !== null &&
                'code' in error &&
                'text' in error &&
                typeof error.code === 'number' &&
                typeof error.text === 'string'
            ) {
                const serviceError = error as TServiceError;
                await this.db.logError(url, serviceError.code, serviceError.text);
                return;
            }

            await this.db.logError(url, 9000, 'Unknown service error');
        } catch (dbError) {
            console.error('[BaseManager] Не удалось записать ошибку в БД:', dbError);
        }
    }

    sendToMap<T, K = undefined>(
        urlPath: string, 
        mapGuid: string,
        armyGuid: string,
        data: T | null = null,
        extraPath?: string
    ): Promise<K | null> {
        const extra = extraPath ? `/${extraPath}` : '';
        return this.send(
            `${CONFIG.SERVICES.MAP_URL}${urlPath}/${mapGuid}/${armyGuid}${extra}`,
            data,
        );
    }

    sendToPeopleArmy<T, K = undefined>(
        urlPath: string,
        data: T | null = null
    ): Promise<K | null> {
        return this.send(`${CONFIG.SERVICES.PEOPLE_ARMY_URL}${urlPath}`, data);
    }

    sendToMushroomsEconomy<T, K = undefined>(
        urlPath: string,
        data: T | null = null
    ): Promise<K | null> {
        return this.send(`${CONFIG.SERVICES.MUSHROOMS_ECONOMY_URL}${urlPath}`, data);
    }
}

export default BaseManager;