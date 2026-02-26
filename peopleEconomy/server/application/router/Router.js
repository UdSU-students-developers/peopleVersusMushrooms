const express = require('express');
const router = express.Router();

const {
    useRegistrationHandler,
    notFoundHandler,
} = require('./handlers');

function Router({ exampleManager }) {
    router.get('/reg/:username/:password', useRegistrationHandler(exampleManager)); //Методы для примера, замените своими
    router.all('/*path', notFoundHandler);
    return router;
}

module.exports = Router;