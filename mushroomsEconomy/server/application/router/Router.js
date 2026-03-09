const express = require('express');
const router = express.Router();
const CONFIG = require('../../config');

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
    registrationHandler,
    loginHandler,
    logoutHandler
} = require('./handlers');

function Router({ exampleManager, gameManager, answer, userManager, io }) {
    io.on(CONFIG.SOCKET.CONNECTION, (socket) => {
        console.log('Подключение: ', socket);

        //Методы для работы с пользователем
        socket.on(CONFIG.SOCKET.REGISTRATION, (data) => registrationHandler(userManager, answer)(data));
        socket.on(CONFIG.SOCKET.LOGIN, (data) => loginHandler(userManager, answer)(data));
        socket.on(CONFIG.SOCKET.LOGOUT, (data) => logoutHandler(userManager, answer)(data));

        //Дисконект
        socket.on(CONFIG.SOCKET.DISCONNECT, () => console.log('Отключение: ', socket));
    });

    //Методы для работы с пользователем
    // router.post('/registration/:login/:password/:username', registrationHandler(userManager, answer));
    // router.get('/login/:login/:password', loginHandler(userManager, answer));
    // router.patch('/logout/:token', logoutHandler(userManager, answer));

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