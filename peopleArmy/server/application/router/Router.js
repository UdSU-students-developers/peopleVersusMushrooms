const express = require('express');
const router = express.Router();

const {
    useRegistrationHandler,
    notFoundHandler,
} = require('./handlers');

function Router(mediator) {
    router.get('/reg/:username/:password', useRegistrationHandler(mediator));
    router.all('/*path', notFoundHandler);
    return router;
}

module.exports = Router;