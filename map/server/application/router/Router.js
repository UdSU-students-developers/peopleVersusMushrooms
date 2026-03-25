const express = require('express');
const Answer = require('./Answer.js');
const answer = new Answer();
const {
 
} = require('./handlers');

function Router(mediator) {
    const router = express.Router();

    // ============ LOBBY ROUTES ============
    // для http методов из LobbyManager - а надо ли? скорее да, чем нет

    // ============ MAP ROUTES ============
    // для http методов из MapManager

    // ============ NOT FOUND ============
    router.get('/*path', (_, res) => {
        res.json(answer.bad(404));
    });

    router.post('/*path', (_, res) => {
        res.json(answer.bad(404));
    });

    return router;
}

module.exports = Router;