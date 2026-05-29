//GLOABL
const GLOBAL_CONFIG = require('../../../../global/globalConfig');
//..

//LOCAL
const express = require('express');
const router = express.Router();


const {
    notFoundHandler,
	useLobbyUpdatedHandler,
    useStartGameHandler,
    useDamageHandler,
    useRequestUnitsHandler,
    useRequestBuildingsHandler,
} = require('./handlers');
const useMoveHandler = require('./handlers/game/useMoveHandler');

function Router({ mediator, answer }) {
	
	// про лобби
	router.post(GLOBAL_CONFIG.URLS.LOBBY_UPDATED, useLobbyUpdatedHandler(mediator, answer));

    //map
    router.post(GLOBAL_CONFIG.URLS.START_GAME, useStartGameHandler(mediator, answer));

    router.post(GLOBAL_CONFIG.URLS.DAMAGE, useDamageHandler(mediator, answer));
    router.post(GLOBAL_CONFIG.URLS.MOVE, useMoveHandler(mediator, answer));
    router.post(GLOBAL_CONFIG.URLS.REQUEST_UNITS, useRequestUnitsHandler(mediator, answer));
    router.post(GLOBAL_CONFIG.URLS.REQUEST_BUILDINGS, useRequestBuildingsHandler(mediator, answer));

    router.all('/*path', notFoundHandler);
    return router;
}

module.exports = Router;