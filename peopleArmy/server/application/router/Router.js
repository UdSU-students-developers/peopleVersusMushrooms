const express = require('express');
const router = express.Router();

const {
    createUnitHandler,
    getAllUnitsHandler,
    setUnitTargetHandler,
    notFoundHandler,
} = require('./handlers');

function Router(mediator) {

    router.get('/unit/create/:guid/:x/:y', createUnitHandler(mediator));
    router.get('/unit/all', getAllUnitsHandler(mediator));
    router.get('/unit/target/:guid/:targetX/:targetY', setUnitTargetHandler(mediator));
    router.all('/*path', notFoundHandler);
    return router;
}

module.exports = Router;
