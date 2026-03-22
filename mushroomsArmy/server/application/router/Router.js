const express = require('express');
const router = express.Router();

const {
    notFoundHandler,
} = require('./handlers');

function Router({ answer }) {
    router.all('/*path', notFoundHandler);
    return router;
}

module.exports = Router;