const express = require('express');
const router = express.Router();

const {
    useRegistrationHandler,
    notFoundHandler,
} = require('./handlers');



function Router(allManagers) {
    router.get('/reg/:username/:password', useRegistrationHandler(allManagers.registrationManager));
    router.all('/*path', notFoundHandler);
    return router;
}

module.exports = Router;