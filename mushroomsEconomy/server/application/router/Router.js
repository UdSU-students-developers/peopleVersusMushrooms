const express = require('express');
const router = express.Router();
const CONFIG = require('../../config');

const SOCKET = CONFIG.SOCKET;

const {
    notFoundHandler,
	useLobbyUpdatedHandler,
} = require('./handlers');

function Router({ mediator, answer }) {
	
	// про лобби
	router.post('/lobbyUpdated', useLobbyUpdatedHandler(mediator, answer));

    router.all('/*path', notFoundHandler);
    return router;
}

module.exports = Router;