import { Request, Response } from 'express';
import CONFIG from '../../../config';

const VALID_UNIT_TYPES = ['sporomet', 'champigneb', 'eblekar'];

export const useSpawnUnitHandler = (mediator: any, answer: any) =>
    (req: Request, res: Response): void => {
        const { armyGuid, type, x, y } = req.body;

        if (!armyGuid || !type || !VALID_UNIT_TYPES.includes(type) || x === undefined || y === undefined) {
            res.json(answer.bad(242));
            return;
        }

        if (typeof x !== 'number' || typeof y !== 'number' || !isFinite(x) || !isFinite(y)) {
            res.json(answer.bad(242));
            return;
        }

        const result = mediator.get(CONFIG.MEDIATOR.TRIGGERS.SPAWN_UNIT, { armyGuid, type, x, y });
        res.json(result ? answer.good(result) : answer.bad(242));
    };
