const express = require('express');
const router = express.Router();

const {
    createUnitHandler,
    unitTakeDamageHandler,
    useLobbyUpdatedHandler,
    notFoundHandler,
} = require('./handlers');

function Router(mediator, answer) {
    router.get('/unit/create/:guid/:x/:y', createUnitHandler(mediator, answer));
    router.get('/unit/takeDamage/:guid/:damage', unitTakeDamageHandler(mediator, answer));

    // про лобби
	router.post('/lobbyUpdated', useLobbyUpdatedHandler(mediator, answer));

    router.all('/*path', notFoundHandler);
    return router;
}

module.exports = Router;