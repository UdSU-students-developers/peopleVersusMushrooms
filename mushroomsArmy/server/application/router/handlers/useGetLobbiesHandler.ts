import { Request, Response } from 'express';
import { IAnswer } from '../../types/global';

const GLOBAL_CONFIG = require('../../../../../global/globalConfig');

type TLobbiesResponse = {
    result: string;
    data?: TLobbiesResponse | unknown[];
};

export const useGetLobbiesHandler = (answer: IAnswer) =>
    async (req: Request, res: Response): Promise<void> => {
        const params = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            body: JSON.stringify({ guid: req.body.guid }),
        };

        const lobbiesResp = await fetch(`${GLOBAL_CONFIG.MAP.URL}${GLOBAL_CONFIG.URLS.GET_LOBBIES}`, params);
        const lobbies = await lobbiesResp.json() as TLobbiesResponse;

        if (lobbies && lobbies.result === 'ok') {
            const inner = lobbies.data;
            const list = (inner && (inner as TLobbiesResponse).result === 'ok') ? (inner as TLobbiesResponse).data : inner;
            res.json(answer.good(Array.isArray(list) ? list : []));
        } else {
            res.json(answer.bad(242));
        }
    };
