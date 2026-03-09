const express = require('express');
const app = express();
const server = require('http').createServer();
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3004",
    }
});

const CONFIG = require('./config');
const Router = require('./application/router/Router');
const DB = require('./application/modules/db/DB');
const Mediator = require('./application/modules/mediator/Mediator');
const Answer = require('./application/Answer');
const ExampleManager = require('./application/modules/exampleModule/ExampleManager');
const GameManager = require('./application/modules/game/GameManager');
const UserManager = require('./application/modules/user/UserManager');
const easystar = require('easystarjs');

const { NAME, PORT, DATABASE } = CONFIG;

const db = new DB({ DATABASE });
const mediator = new Mediator(CONFIG.MEDIATOR);
const answer = new Answer();

const exampleManager = new ExampleManager({
    mediator: mediator, 
    db: db
});

const gameManager = new GameManager({
    mediator: mediator, 
    db: db, 
    answer: answer,
    easystar: easystar
});

const userManager = new UserManager({
    mediator: mediator, 
    db: db,
});

const router = new Router({ exampleManager, gameManager, answer, userManager, io });

app.use(express.static(`${__dirname}/public`));
app.use('/', router);

function deinit() {
    db.destructor();
    setTimeout(() => process.exit(), 500);
}

server.listen(PORT, () => console.log(`${NAME} started at port ${PORT}`));

process.on('SIGNINT', deinit);