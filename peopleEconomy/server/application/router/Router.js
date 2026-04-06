const express = require('express');
const router = express.Router();
const {
    useStartGameHandler,
    useLobbiesUpdatedHandler
} = require('./handlers');

function Router(mediator, answer, common) {
    // ============ LOBBY ROUTES ============
    router.post('/startGame{/:guid}', useStartGameHandler(mediator, answer, common));
    router.post('/lobbiesUpdated', useLobbiesUpdatedHandler(mediator, answer, common));

    // ============ BUILDING ROUTES ============
    // для http методов из BuildingManager

    // ============ NOT FOUND ============
    router.all('/*path', (_, res) => {
        res.json(answer.bad(404));
    });


    return router;
}

module.exports = Router;