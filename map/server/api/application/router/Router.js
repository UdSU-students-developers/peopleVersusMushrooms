const express = require('express');
const Answer = require('./Answer.js');
const { 
    useTestHandler,
    useTestDataBaseHandler,
} = require('./handlers');

function Router(mediator) {
    const router = express.Router();

    // ============ TEST ROUTES ============
    router.get('/test{/:data1}{/:data2}', useTestHandler(mediator, Answer));
    router.get('/testDB{/:userId}', useTestDataBaseHandler(mediator, Answer));


    // ============ NOT FOUND ============
    router.get('/*path', (_, res) => {
         res.json(Answer.bad(404));
    });

    router.post('/*path', (_, res) => {
         res.json(Answer.bad(404));
    });

    return router;
}

module.exports = Router;