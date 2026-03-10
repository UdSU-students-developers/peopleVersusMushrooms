const CONFIG = require('./config');

const express = require('express');
const app = express();
const server = require('http').createServer();
const io = require('socket.io')(server, {cors: CONFIG.CORS});

const Router = require('./application/router/Router');
const DB = require('./application/modules/db/DB');
const Mediator = require('./application/modules/mediator/Mediator');
const Common = require('./application/modules/common/Common');
const Answer = require('./application/Answer');
const GameManager = require('./application/modules/game/GameManager');

const { NAME, PORT, DATABASE } = CONFIG;

const db = new DB({ DATABASE });
const mediator = new Mediator(CONFIG.MEDIATOR);
const common = new Common();
const answer = new Answer();

const gameManager = new GameManager( { mediator, db, common, io, answer } );

app.use(express.static(`${__dirname}/public`));
app.use('/', new Router(mediator, answer));

function deinit() {
    db.destrucor();
    setTimeout(() => process.exit(), 500);
}

const startLog = `${NAME} started at port ${PORT} \nYou can connect to server ONLY from CORS: \n ${CONFIG.CORS.origin}`;

server.listen(PORT, () => console.log(startLog));

process.on('SIGNINT', deinit);