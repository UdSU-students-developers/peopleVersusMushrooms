const express = require('express');
const router = express.Router();

const {
    useRegistrationHandler,
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

function Router(mediator) {
    router.get('/reg/:username/:password', useRegistrationHandler(exampleManager)); //Методы для примера, замените своими

    //Методы для работы с mushroom
    router.get('/mushroom/getAll', getAllMushroomsHandler(gameManager, answer));
    router.post('/mushroom/create', createMushroomHandler(gameManager, answer));
    router.post('/mushroom/update', updateMushroomHandler(gameManager, answer));
    router.delete('/mushroom/delete', deleteMushroomHandler(gameManager, answer));

    //Методы для работы с unit
    router.get('/unit/getAll', getAllUnitsHandler(gameManager, answer));
    router.post('/unit/create', createUnitHandler(gameManager, answer));
    router.post('/unit/update', updateUnitHandler(gameManager, answer));
    router.delete('/unit/delete', deleteUnitHandler(gameManager, answer));

    //Методы для работы с матрицей
    router.post('/matrix/update', updateMatrixHandler(gameManager, answer));

    router.all('/*path', notFoundHandler);
    return router;
}

module.exports = Router;