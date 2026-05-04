import { Request, Response } from 'express';

export const useLobbyUpdatedHandler = (mediator: any, answer: any) =>
    (req: Request, res: Response): void => {
        const { lobbies } = req.body;
        if (!lobbies) {
            res.json(answer.bad(242));
            return;
        }
        const { LOBBY_UPDATED } = mediator.getEventTypes();
        mediator.call(LOBBY_UPDATED, lobbies);
        res.json(answer.good(true));
    };
