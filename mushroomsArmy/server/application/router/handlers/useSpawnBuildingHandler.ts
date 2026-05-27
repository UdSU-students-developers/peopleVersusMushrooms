import { Request, Response } from 'express';
import CONFIG from '../../../config';
import { IAnswer, IMediator } from '../../types/global';

const VALID_BUILDING_TYPES = ['vzryvomor', 'sporovaya_bashnya'];

export const useSpawnBuildingHandler = (mediator: IMediator, answer: IAnswer) =>
    (req: Request, res: Response): void => {
        const { armyGuid, type, x, y } = req.body;

        if (!armyGuid || Array.isArray(armyGuid) || !type || !VALID_BUILDING_TYPES.includes(type) || x === undefined || y === undefined) {
            res.json(answer.bad(242));
            return;
        }

        if (typeof x !== 'number' || typeof y !== 'number' || !isFinite(x) || !isFinite(y)) {
            res.json(answer.bad(242));
            return;
        }

        const result = mediator.get(CONFIG.MEDIATOR.TRIGGERS.SPAWN_BUILDING, { armyGuid, type, x, y });
        res.json(result ? answer.good(result) : answer.bad(242));
    };
