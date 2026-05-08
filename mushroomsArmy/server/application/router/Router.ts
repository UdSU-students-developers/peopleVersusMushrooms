// GLOBAL
const GLOBAL_CONFIG = require('../../../../global/globalConfig');

// LOCAL
import express, { Router as ExpressRouter } from 'express';
import {
    notFoundHandler,
    useLobbyUpdatedHandler,
    useMoveUnitHandler,
    useSpawnUnitHandler,
    useGetArmyHandler,
    useTakeDamageHandler,
    useStartGameHandler,
    useGetLobbiesHandler,
    useSpawnBuildingHandler,
} from './handlers';

type TRouterOptions = {
    answer: any;
    mediator: any;
};

function Router({ answer, mediator }: TRouterOptions): ExpressRouter {
    const router = express.Router();

    router.post(GLOBAL_CONFIG.URLS.LOBBY_UPDATED, useLobbyUpdatedHandler(mediator, answer));
    router.post('/moveUnit',      useMoveUnitHandler(mediator, answer));
    router.post('/spawnUnit',     useSpawnUnitHandler(mediator, answer));
    router.post('/getArmy',       useGetArmyHandler(mediator, answer));
    router.post('/takeDamage',    useTakeDamageHandler(mediator, answer));
    router.post('/startGame',     useStartGameHandler(mediator, answer));
    router.post('/getLobbies',    useGetLobbiesHandler(answer));
    router.post('/spawnBuilding', useSpawnBuildingHandler(mediator, answer));

    router.all('/*path', notFoundHandler);
    return router;
}

export default Router;
