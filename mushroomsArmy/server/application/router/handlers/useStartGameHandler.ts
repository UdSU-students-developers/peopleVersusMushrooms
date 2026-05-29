import { Request, Response } from 'express';
import CONFIG from '../../../config';
import { IAnswer, IMediator } from '../../types/global';

export const useStartGameHandler = (mediator: IMediator, answer: IAnswer) =>
    (req: Request, res: Response): void => {
        const { armyGuid, mushroomsArmy, mapGuid, map, buildings, peopleArmy, mushroomsEconomy, peopleEconomy } = req.body;

        // Поддерживаем оба варианта: armyGuid напрямую или mushroomsArmy (от map-сервера)
        const guid = armyGuid ?? mushroomsArmy;

        if (!guid || !mapGuid) {
            res.json(answer.bad(242));
            return;
        }

        mediator.call(CONFIG.MEDIATOR.EVENTS.START_GAME, {
            guid,
            mapGuid,
            map: map ?? null,
            buildings: buildings ?? [],
            peopleArmyGuid: peopleArmy ?? null,
            mushroomsEconomyGuid: mushroomsEconomy ?? null,
            peopleEconomyGuid: peopleEconomy ?? null,
        });

        res.json(answer.good(true));
    };
