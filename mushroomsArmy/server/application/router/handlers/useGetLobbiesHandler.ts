import { Request, Response } from 'express';

const GLOBAL_CONFIG = require('../../../../../global/globalConfig');

export const useGetLobbiesHandler = (answer: any) =>
    async (req: Request, res: Response): Promise<void> => {
        const params = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            body: JSON.stringify({ guid: req.body.guid }),
        };

        const lobbiesResp = await fetch(`${GLOBAL_CONFIG.MAP.URL}${GLOBAL_CONFIG.URLS.GET_LOBBIES}`, params);
        const lobbies: any = await lobbiesResp.json();

        if (lobbies && lobbies.result === 'ok') {
            const inner = lobbies.data;
            const list = (inner && inner.result === 'ok') ? inner.data : inner;
            res.json(answer.good(Array.isArray(list) ? list : []));
        } else {
            res.json(answer.bad(242));
        }
    };
