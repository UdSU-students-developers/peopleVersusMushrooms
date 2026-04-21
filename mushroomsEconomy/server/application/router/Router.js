//GLOABL
const GLOABL_CONFIG = require('../../../../global/globalConfig');
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
	router.post('/lobbyUpdated', useLobbyUpdatedHandler(mediator, answer));

    //map
    router.post('/startGame', useStartGameHandler(mediator, answer));

    router.all('/*path', notFoundHandler);
    return router;
}

module.exports = Router;