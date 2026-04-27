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

type TMoveUnitBody = {
    armyGuid: string;
    unitGuid: string;
    x: number;
    y: number;
};

type TGetArmyBody = {
    armyGuid: string;
};

type TSpawnUnitBody = {
    armyGuid: string;
    type: 'sporomet' | 'champigneb' | 'eblekar';
    x: number;
    y: number;
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

    router.post('/moveUnit', (req: Request, res: Response) => {
        const { armyGuid, unitGuid, x, y } = req.body as TMoveUnitBody;

        if (!armyGuid || !unitGuid || x === undefined || y === undefined) {
            res.json(answer.bad(242));
            return;
        }

        if (typeof x !== 'number' || typeof y !== 'number' || !isFinite(x) || !isFinite(y)) {
            res.json(answer.bad(242));
            return;
        }

        const MOVE_UNIT = CONFIG.MEDIATOR.TRIGGERS.MOVE_UNIT;
        const result = mediator.get(MOVE_UNIT, { armyGuid, unitGuid, x, y });

        if (result) {
            res.json(answer.good(true));
        } else {
            res.json(answer.bad(242));
        }
    });

    router.post('/spawnUnit', (req: Request, res: Response) => {
        const { armyGuid, type, x, y } = req.body as TSpawnUnitBody;

        const validTypes = ['sporomet', 'champigneb', 'eblekar'];
        if (!armyGuid || !type || !validTypes.includes(type) || x === undefined || y === undefined) {
            res.json(answer.bad(242));
            return;
        }

        if (typeof x !== 'number' || typeof y !== 'number' || !isFinite(x) || !isFinite(y)) {
            res.json(answer.bad(242));
            return;
        }

        const SPAWN_UNIT = CONFIG.MEDIATOR.TRIGGERS.SPAWN_UNIT;
        const result = mediator.get(SPAWN_UNIT, { armyGuid, type, x, y });

        if (result) {
            res.json(answer.good(result));
        } else {
            res.json(answer.bad(242));
        }
    });

    router.post('/getArmy', (req: Request, res: Response) => {
        const { armyGuid } = req.body as TGetArmyBody;

        if (!armyGuid || Array.isArray(armyGuid)) {
            res.json(answer.bad(242));
            return;
        }

        const GET_ARMY = CONFIG.MEDIATOR.TRIGGERS.GET_ARMY;
        const army = mediator.get(GET_ARMY, armyGuid);

        if (army) {
            res.json(answer.good(army));
        } else {
            res.json(answer.bad(242));
        }
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

    router.post('/startGame', (req: Request, res: Response) => {
        const payload = req.body as {
            mapGuid?: string;
            map?: unknown;
            buildings?: unknown;
            mushroomsArmy?: string;
        };

        // map шлёт: { mapGuid, spectator, peopleArmy, peopleEconomy, mushroomsArmy, mushroomsEconomy }
        // map не шлёт map[] — eventStartGame сам запросит рельеф через GET_RELIEF
        if (!payload.mushroomsArmy || !payload.mapGuid) {
            res.json(answer.bad(242));
            return;
        }

        mediator.call(CONFIG.MEDIATOR.EVENTS.START_GAME, {
            guid: payload.mushroomsArmy,
            mapGuid: payload.mapGuid,
            map: payload.map ?? null,
            buildings: payload.buildings ?? [],
        });

        res.json(answer.good(true));
    });

    router.post('/getLobbies', async (req: Request, res: Response) => {
        const params = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({ guid: req.body.guid })
        };
        const getLobbiesUrl = `${GLOBAL_CONFIG.MAP.URL}${GLOBAL_CONFIG.URLS.GET_LOBBIES}`;
        const lobbiesResp = await fetch(getLobbiesUrl, params);
        const lobbies: any = await lobbiesResp.json();

        if (lobbies && lobbies.result === 'ok') {
            // Карта оборачивает ответ дважды: { result, data: { result, data: [...] } }
            const inner = lobbies.data;
            const list = (inner && inner.result === 'ok') ? inner.data : inner;
            res.json(answer.good(Array.isArray(list) ? list : []));
        } else {
            res.json(answer.bad(242));
        }
    });

    router.all('/*path', notFoundHandler);
    return router;
}

export default Router;