const express = require('express');
const router = express.Router();
const {
    useGetReliefHandler,
    useGetVisibilityHandler,
    useGetResourseVisibilityHandler,
    useGetGeneratedMapHandler,
    useUpdateUnitsHandler,
    useUpdateBuildingsHandler,
    useGetLobbiesHandler,
    useJoinToLobbyHandler,
} = require('./handlers');

function Router(mediator, answer, common) {
    // ============ LOBBY ROUTES ============
    router.get('/getLobbies/:guid', useGetLobbiesHandler(mediator, answer, common));

    router.post('/joinToLobby', useJoinToLobbyHandler(mediator, answer, common));

    // ============ MAP ROUTES ============
    // для http методов из MapManager
    router.get('/getRelief/{/:mapGuid}{/:userGuid}', useGetReliefHandler(mediator, answer, common));
    router.get('/getGeneratedMap', useGetGeneratedMapHandler(mediator, answer, common));
    router.get('/getVisibility{/:mapGuid}{/:userGuid}', useGetVisibilityHandler(mediator, answer, common));
    router.get('/getResourseVisibility{/:mapGuid}{/:userGuid}', useGetResourseVisibilityHandler(mediator, answer, common));

    router.post('/updateUnitsHandler', useUpdateUnitsHandler(mediator, answer, common));
    router.post('/updateBuildingsHandler', useUpdateBuildingsHandler(mediator, answer, common));


    // ============ NOT FOUND ============
    router.all('/*path', (_, res) => {
        res.json(answer.bad(404));
    });


    return router;
}

module.exports = Router;