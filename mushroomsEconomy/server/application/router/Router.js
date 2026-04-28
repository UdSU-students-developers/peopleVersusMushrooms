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
} = require('./handlers');

function Router({ mediator, answer }) {
	
	// про лобби
	router.post(GLOBAL_CONFIG.URLS.LOBBY_UPDATED, useLobbyUpdatedHandler(mediator, answer));

    //map
    router.post(GLOBAL_CONFIG.URLS.START_GAME, useStartGameHandler(mediator, answer));

    router.all('/*path', notFoundHandler);
    return router;
}

module.exports = Router;