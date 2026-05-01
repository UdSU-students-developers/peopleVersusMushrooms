const express = require('express');
const router = express.Router();

const {
    createUnitHandler,
    unitTakeDamageHandler,
    unitMoveHandler,
    useLobbyUpdatedHandler,
    startGameHandler,
    notFoundHandler,
} = require('./handlers');

function Router(mediator, answer) {
    router.post('/unit/create', createUnitHandler(mediator, answer));
    router.post('/unit/takeDamage', unitTakeDamageHandler(mediator, answer));
    router.post('/unit/move', unitMoveHandler(mediator, answer));


    // про лобби
	router.post('/lobbyUpdated', useLobbyUpdatedHandler(mediator, answer));
    router.post('/startGame', startGameHandler(mediator, answer));

    router.all('/*path', notFoundHandler);
    return router;
}

module.exports = Router;