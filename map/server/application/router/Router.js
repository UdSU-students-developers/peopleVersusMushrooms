const express = require('express');
const router = express.Router();
const {
    getReliefHandler,
    getVisibilityHandler,
    getResourseVisibilityHandler,
    updateUnitsHandler,
    updateBuildingsHandler,
    useGetLobbiesHandler,
    useJoinToLobbyHandler,
} = require('./handlers');

function Router(mediator, answer, common) {
    // ============ LOBBY ROUTES ============
    router.get('/getLobbies/:guid', useGetLobbiesHandler(mediator, answer, common));

    router.post('/joinToLobby', useJoinToLobbyHandler(mediator, answer, common));

    // ============ MAP ROUTES ============
    // для http методов из MapManager
    router.get('/getRelief/{/:mapGuid}{/:userGuid}', getReliefHandler(mediator, answer, common));
    router.get('/getVisibility{/:mapGuid}{/:userGuid}', getVisibilityHandler(mediator, answer, common));
    router.get('/getResourseVisibility{/:mapGuid}{/:userGuid}', getResourseVisibilityHandler(mediator, answer, common));

    router.post('/updateUnitsHandler', updateUnitsHandler(mediator, answer, common));
    router.post('/updateBuildingsHandler', updateBuildingsHandler(mediator, answer, common));


    //еще 4

    // ============ NOT FOUND ============
    router.all('/*path', (_, res) => {
        res.json(answer.bad(404));
    });


    return router;
}

module.exports = Router;