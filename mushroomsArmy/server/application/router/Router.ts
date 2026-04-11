import express, { Request, Response, Router as ExpressRouter } from 'express';
import { notFoundHandler } from './handlers';
import Answer from '../Answer';
import Mediator from '../modules/Mediator';
import CONFIG from '../../config';

type TRouterOptions = {
    answer: Answer;
    mediator: Mediator;
};

type TTakeDamageBody = {
    unitGuid: string;
    amount: number;
    type: string;
};

function Router({ answer, mediator }: TRouterOptions): ExpressRouter {
    const router = express.Router();

    router.post('/takeDamage/:armyGuid', (req: Request, res: Response) => {
        const { armyGuid } = req.params;
        const { unitGuid, amount, type } = req.body as TTakeDamageBody;

        if (!armyGuid || Array.isArray(armyGuid) || !unitGuid || amount === undefined || !type) {
            res.json(answer.bad(13));
            return;
        }

        if (typeof amount !== 'number' || amount < 0 || !isFinite(amount)) {
            res.json(answer.bad(13));
            return;
        }

        const TAKE_DAMAGE = CONFIG.MEDIATOR.TRIGGERS.TAKE_DAMAGE_HANDLER;
        const result = mediator.get<boolean, { armyGuid: string; unitGuid: string; amount: number; type: string }>(
            TAKE_DAMAGE,
            { armyGuid, unitGuid, amount, type }
        );

        if (result) {
            res.json(answer.good(true));
        } else {
            res.json(answer.bad(13));
        }
    });

    router.post('/startGame/:armyGuid', (req: Request, res: Response) => {
        const { armyGuid } = req.params;
        const payload = req.body as { mapGuid?: string; map?: unknown; buildings?: unknown };

        if (!armyGuid || Array.isArray(armyGuid) || !payload.mapGuid || !payload.map) {
            res.json(answer.bad(13));
            return;
        }

        mediator.call('START_GAME', {
            guid: armyGuid,
            mapGuid: payload.mapGuid,
            map: payload.map,
            buildings: payload.buildings ?? [],
        });

        res.json(answer.good(true));
    });

    router.all('/*path', notFoundHandler);
    return router;
}

export default Router;