const express = require('express');
const router = express.Router();

const {
    useRegistrationHandler,
    createUnitHandler,
    setUnitTargetHandler,
    notFoundHandler,
    useLoginHandler,
    useLogoutHandler,
} = require('./handlers');

function Router(mediator) {
    router.get('/reg/:username/:password', useRegistrationHandler(mediator));
    router.get('/login/:username/:password', useLoginHandler(mediator));
    router.get('/logout/:username', useLogoutHandler(mediator));

    router.get('/unit/create/:guid/:x/:y', createUnitHandler(mediator));
    router.get('/unit/target/:guid/:targetX/:targetY', setUnitTargetHandler(mediator));
    router.all('/*path', notFoundHandler);
    return router;
}

module.exports = Router;