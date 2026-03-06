const express = require('express');
const Answer = require('./Answer.js');
const {
    useLoginHandler,
    useRegistrationHandler,
    useLogoutHandler,
} = require('./handlers');

function Router(mediator) {
    const router = express.Router();

    // ============ USER ROUTES ============
    router.get('/login{/:login}{/:passwordHash}', useLoginHandler(mediator, Answer));
    router.get('/registration{/:login}{/:passwordHash}{/:nickname}', useRegistrationHandler(mediator, Answer));
    router.get('/logout{/:token}', useLogoutHandler(mediator, Answer));


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