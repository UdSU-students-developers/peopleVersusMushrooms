const express = require('express');
const router = express.Router();

const { URLS } = require('../../../../global/globalConfig');
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
    router.post(URLS.GET_LOBBIES, useGetLobbiesHandler(mediator, answer, common));
    router.post(URLS.CREATE_LOBBY, useCreateLobbyHandler(mediator, answer, common));
    router.post(URLS.JOIN_TO_LOBBY, useJoinToLobbyHandler(mediator, answer, common));
    router.post(URLS.LEAVE_LOBBY, useLeaveLobbyHandler(mediator, answer, common));
    router.post(URLS.DROP_FROM_LOBBY, useDropFromLobbyHandler(mediator, answer, common));
    router.post(URLS.START_GAME, useStartGameHandler(mediator, answer, common));
    router.post(URLS.SET_READY, useSetReadyHandler(mediator, answer, common));

    // ============ MAP ROUTES ============
    router.get(`${URLS.GET_RELIEF}{/:mapGuid}{/:userGuid}`, useGetReliefHandler(mediator, answer, common));
    router.get(`${URLS.GET_VISIBILITY}{/:mapGuid}{/:userGuid}`, useGetVisibilityHandler(mediator, answer, common));
    router.get(`${URLS.GET_RESOURSE_VISIBILITY}{/:mapGuid}{/:userGuid}`, useGetResourseVisibilityHandler(mediator, answer, common));
    router.get('/getGeneratedMap', useGetGeneratedMapHandler(mediator, answer, common));

    router.post(URLS.UPDATE_UNITS, useUpdateUnitsHandler(mediator, answer, common));
    router.post(URLS.UPDATE_BUILDINGS, useUpdateBuildingsHandler(mediator, answer, common));


    // ============ NOT FOUND ============
    router.all('/*path', (_, res) => {
        res.json(answer.bad(404));
    });


    return router;
}

module.exports = Router;