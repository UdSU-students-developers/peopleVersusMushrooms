// GLOBAL
const GLOBAL_CONFIG = require('../../../../global/globalConfig');

// LOCAL
import express, { Request, Response, Router as ExpressRouter } from 'express';
import { notFoundHandler } from './handlers';
import CONFIG from '../../config';

type TRouterOptions = {
    answer: any;
    mediator: any;
};

type TTakeDamageBody = {
    unitGuid: string;
    amount: number;
    type: string;
};

function Router({ answer, mediator }: TRouterOptions): ExpressRouter {
    const router = express.Router();

    // про лобби
    router.post(GLOBAL_CONFIG.URLS.LOBBY_UPDATED, (req: Request, res: Response) => {
        const { lobbies } = req.body;
        if (!lobbies) {
            return res.json(answer.bad(242));
        }
        const { LOBBY_UPDATED } = mediator.getEventTypes();
        mediator.call(LOBBY_UPDATED, lobbies);
        return res.json(answer.good(true));
    });

    router.post('/takeDamage/:armyGuid', (req: Request, res: Response) => {
        const { armyGuid } = req.params;
        const { unitGuid, amount, type } = req.body as TTakeDamageBody;

        if (!armyGuid || Array.isArray(armyGuid) || !unitGuid || amount === undefined || !type) {
            res.json(answer.bad(242));
            return;
        }

        if (typeof amount !== 'number' || amount < 0 || !isFinite(amount)) {
            res.json(answer.bad(242));
            return;
        }

        const TAKE_DAMAGE = CONFIG.MEDIATOR.TRIGGERS.TAKE_DAMAGE_HANDLER;
        const result = mediator.get(TAKE_DAMAGE, { armyGuid, unitGuid, amount, type });

        if (result) {
            res.json(answer.good(true));
        } else {
            res.json(answer.bad(242));
        }
    });

    router.post('/startGame/:armyGuid', (req: Request, res: Response) => {
        const { armyGuid } = req.params;
        const payload = req.body as { mapGuid?: string; map?: unknown; buildings?: unknown };

        if (!armyGuid || Array.isArray(armyGuid) || !payload.mapGuid || !payload.map) {
            res.json(answer.bad(242));
            return;
        }

        mediator.call(CONFIG.MEDIATOR.EVENTS.START_GAME, {
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