import { Request, Response } from 'express';
import CONFIG from '../../../config';
import { IAnswer, IMediator } from '../../types/global';

export const useGetArmyHandler = (mediator: IMediator, answer: IAnswer) =>
    (req: Request, res: Response): void => {
        const { armyGuid } = req.body;

        if (!armyGuid || Array.isArray(armyGuid)) {
            res.json(answer.bad(242));
            return;
        }

        const army = mediator.get(CONFIG.MEDIATOR.TRIGGERS.GET_ARMY, armyGuid);
        res.json(army ? answer.good(army) : answer.bad(242));
    };
