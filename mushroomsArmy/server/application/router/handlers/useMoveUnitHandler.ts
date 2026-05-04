import { Request, Response } from 'express';
import CONFIG from '../../../config';

export const useMoveUnitHandler = (mediator: any, answer: any) =>
    (req: Request, res: Response): void => {
        const { armyGuid, unitGuid, x, y } = req.body;

        if (!armyGuid || !unitGuid || x === undefined || y === undefined) {
            res.json(answer.bad(242));
            return;
        }

        if (typeof x !== 'number' || typeof y !== 'number' || !isFinite(x) || !isFinite(y)) {
            res.json(answer.bad(242));
            return;
        }

        const result = mediator.get(CONFIG.MEDIATOR.TRIGGERS.MOVE_UNIT, { armyGuid, unitGuid, x, y });
        res.json(result ? answer.good(true) : answer.bad(242));
    };
