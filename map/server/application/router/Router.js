const express = require('express');
const router = express.Router();
const {
    getVisibilityHandler,
    getResourseVisibilityHandler
} = require('./handlers');

function Router(mediator, answer, common) {
    // ============ LOBBY ROUTES ============
    // для http методов из LobbyManager

    // ============ MAP ROUTES ============
    // для http методов из MapManager
    router.get('/getVisibility{/:mapGuid}{/:userGuid}{/:visibilityJSON}', getVisibilityHandler(mediator, answer, common));
    router.get('/getResourseVisibility{/:mapGuid}{/:userGuid}{/:visibilityJSON}', getResourseVisibilityHandler(mediator, answer, common));
    router.get('/updateEconomyUnitsHandler{/:mapGuid}{/:userGuid}{/:unitsJSON}', getResourseVisibilityHandler(mediator, answer, common));

    //еще 4

    // ============ NOT FOUND ============
    router.all('/*path', (_, res) => {
        res.json(answer.bad(404));
    });


    return router;
}

module.exports = Router;