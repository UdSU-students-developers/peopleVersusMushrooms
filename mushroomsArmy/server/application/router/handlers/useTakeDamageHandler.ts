import { Request, Response } from 'express';
import CONFIG from '../../../config';

export const useTakeDamageHandler = (mediator: any, answer: any) =>
    (req: Request, res: Response): void => {
        const { armyGuid, unitGuid, amount, type } = req.body;

        if (!armyGuid || Array.isArray(armyGuid) || !unitGuid || amount === undefined || !type) {
            res.json(answer.bad(242));
            return;
        }

        if (typeof amount !== 'number' || amount < 0 || !isFinite(amount)) {
            res.json(answer.bad(242));
            return;
        }

        const result = mediator.get(CONFIG.MEDIATOR.TRIGGERS.TAKE_DAMAGE_HANDLER, { armyGuid, unitGuid, amount, type });
        res.json(result ? answer.good(true) : answer.bad(242));
    };
