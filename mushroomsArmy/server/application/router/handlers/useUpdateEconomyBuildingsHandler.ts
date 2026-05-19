import { Request, Response } from 'express';
import CONFIG from '../../../config';
import { TBuildingInput } from '../../army/Army';
import { IAnswer, IMediator } from '../../types/global';

type TBody = {
    armyGuid: string;
    buildings: TBuildingInput[];
};

export const useUpdateEconomyBuildingsHandler = (mediator: IMediator, answer: IAnswer) => {
    return (req: Request, res: Response) => {
        const { armyGuid, buildings } = req.body as TBody;

        if (!armyGuid || !Array.isArray(buildings)) {
            res.json(answer.bad(242));
            return;
        }

        const UPDATE_ECONOMY_BUILDINGS = CONFIG.MEDIATOR.TRIGGERS.UPDATE_ECONOMY_BUILDINGS;
        const result = mediator.get(UPDATE_ECONOMY_BUILDINGS, { armyGuid, buildings });

        if (result) {
            res.json(answer.good(true));
        } else {
            res.json(answer.bad(242));
        }
    };
};