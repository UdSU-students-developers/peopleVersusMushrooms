const express = require('express');
const router = express.Router();
const {
    useGetReliefHandler,
    useGetVisibilityHandler,
    useGetResourseVisibilityHandler,
    useGetGeneratedMapHandler,
    useUpdateUnitsHandler,
    useUpdateBuildingsHandler,

    useCreateLobbyHandler,
    useJoinToLobbyHandler,
    useLeaveLobbyHandler,
    useDropFromLobbyHandler,
    useStartGameHandler,
    useGetLobbiesHandler,
    useSetReadyHandler,

} = require('./handlers');

function Router(mediator, answer, common) {
    // ============ LOBBY ROUTES ============
    router.post('/getLobbies', useGetLobbiesHandler(mediator, answer, common));
    router.post('/createLobby', useCreateLobbyHandler(mediator, answer, common));
    router.post('/joinToLobby', useJoinToLobbyHandler(mediator, answer, common));
    router.post('/leaveLobby', useLeaveLobbyHandler(mediator, answer, common));
    router.post('/dropFromLobby', useDropFromLobbyHandler(mediator, answer, common));
    router.post('/startGame', useStartGameHandler(mediator, answer, common));
    router.post('/setReady', useSetReadyHandler(mediator, answer, common));

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