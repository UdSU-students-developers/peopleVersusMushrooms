const express = require('express');
const router = express.Router();
const CONFIG = require('../../config');

const SOCKET = CONFIG.SOCKET;

const {
    notFoundHandler,
    getAllMushroomsHandler,
    createMushroomHandler,
    updateMushroomHandler,
    deleteMushroomHandler,
    getAllUnitsHandler,
    createUnitHandler,
    updateUnitHandler,
    deleteUnitHandler,
    updateMatrixHandler,
} = require('./handlers');

function Router({ mediator, answer }) {
    //Методы для работы с mushroom
    router.get('/mushroom/getAll', getAllMushroomsHandler(gameManager, answer));
    router.post('/mushroom/create', createMushroomHandler(gameManager, answer));
    router.post('/mushroom/update', updateMushroomHandler(gameManager, answer));
    router.delete('/mushroom/delete', deleteMushroomHandler(gameManager, answer));

    // Units
    router.get('/unit/getAll', getAllUnitsHandler(mediator, answer));
    router.get('/unit/create', createUnitHandler(mediator, answer));
    router.get('/unit/update', updateUnitHandler(mediator, answer));
    router.get('/unit/delete', deleteUnitHandler(mediator, answer));

    // Matrix
    router.get('/matrix/update', updateMatrixHandler(mediator, answer));

    router.all('/*path', notFoundHandler);
    return router;
}

module.exports = Router;