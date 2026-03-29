const express = require('express');
const router = express.Router();

const {
    createUnitHandler,
    getAllUnitsHandler,
    setUnitTargetHandler,
    notFoundHandler,
} = require('./handlers');

function Router(mediator, answer) {
    router.get('/unit/create/:guid/:x/:y', createUnitHandler(mediator, answer));
    router.get('/unit/all', getAllUnitsHandler(mediator, answer));
    router.get('/unit/target/:guid/:targetX/:targetY', setUnitTargetHandler(mediator, answer));
    router.all('/*path', notFoundHandler);
    return router;
}

module.exports = Router;
