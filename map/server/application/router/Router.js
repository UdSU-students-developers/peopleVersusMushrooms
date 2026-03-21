const express = require('express');
const router = express.Router();
const {
    getVisibilityHandler
} = require('./handlers');

function Router(mediator, answer) {
    // ============ LOBBY ROUTES ============
    // для http методов из LobbyManager

    // ============ MAP ROUTES ============
    // для http методов из MapManager
    router.get('/getVisibility/:mapGuid/:userGuid', getVisibilityHandler(mediator, answer));
    //еще 4

    // ============ NOT FOUND ============
    router.all('/*path', (_, res) => {
        res.json(answer.bad(404));
    });


    return router;
}

module.exports = Router;