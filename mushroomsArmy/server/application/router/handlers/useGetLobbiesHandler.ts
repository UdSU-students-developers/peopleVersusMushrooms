import { Request, Response } from 'express';
import { IAnswer } from '../../types/global';

const GLOBAL_CONFIG = require('../../../../../global/globalConfig');

type TApiResponse<T> = {
    result: string;
    data?: T;
};

export const useGetLobbiesHandler = (answer: IAnswer) =>
    async (req: Request, res: Response): Promise<void> => {
        const params = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            body: JSON.stringify({ guid: req.body.guid }),
        };

        const raw = await fetch(`${GLOBAL_CONFIG.MAP.URL}${GLOBAL_CONFIG.URLS.GET_LOBBIES}`, params);
        const lobbies = await raw.json() as TApiResponse<unknown[]>;

        if (lobbies?.result === 'ok' && Array.isArray(lobbies.data)) {
            res.json(answer.good(lobbies.data));
        } else {
            res.json(answer.bad(242));
        }
    };
