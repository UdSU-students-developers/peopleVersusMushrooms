import { Request, Response } from 'express';
import CONFIG from '../../../config';
import { IAnswer, IMediator } from '../../types/global';

export const useTakeDamageHandler = (mediator: IMediator, answer: IAnswer) =>
    (req: Request, res: Response): void => {
        const { armyGuid, unitGuid, amount } = req.body;

        if (!armyGuid || Array.isArray(armyGuid) || !unitGuid || amount === undefined) {
            res.json(answer.bad(242));
            return;
        }

        if (typeof amount !== 'number' || amount < 0 || !isFinite(amount)) {
            res.json(answer.bad(242));
            return;
        }

        const result = mediator.get(CONFIG.MEDIATOR.TRIGGERS.TAKE_DAMAGE_HANDLER, { armyGuid, unitGuid, amount });
        res.json(result ? answer.good(true) : answer.bad(242));
    };
