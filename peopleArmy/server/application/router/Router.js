const express = require('express');
const router = express.Router();

const {
    useRegistrationHandler,
    createUnitHandler,
    notFoundHandler,
} = require('./handlers');

function Router(mediator) {
    router.get('/reg/:username/:password', useRegistrationHandler(mediator));
    router.get('/unit/create/:guid/:x/:y', createUnitHandler(mediator));
    router.all('/*path', notFoundHandler);
    return router;
}

module.exports = Router;