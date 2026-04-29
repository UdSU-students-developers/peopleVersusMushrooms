//GLOBAL
const { URLS } = require('../../../../global/globalConfig');
//..

//LOCAL
const express = require('express');
const router = express.Router();


const {
    notFoundHandler,
	useLobbyUpdatedHandler,
} = require('./handlers');

function Router({ mediator, answer, common }) {

    // ============ LOBBY ROUTES ============
	router.post(URLS.LOBBY_UPDATED, useLobbyUpdatedHandler(mediator, answer, common));

    // ============ NOT FOUND ============
    router.all('/*path', notFoundHandler);
    return router;
}

module.exports = Router;