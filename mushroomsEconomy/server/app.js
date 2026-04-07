const CONFIG = require('./config');

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {cors: CONFIG.CORS});

const Router = require('./application/router/Router');
const DB = require('./application/modules/db/DB');
const Mediator = require('./application/modules/mediator/Mediator');
const Answer = require('./application/Answer');
const GameManager = require('./application/modules/game/GameManager');
const UserManager = require('./application/modules/user/UserManager');
const Common = require('./application/modules/common/Common');
const ChatManager = require('./application/modules/chat/ChatManager');
const LobbyManager = require('./application/modules/lobby/LobbyManager');

const { NAME, PORT, DATABASE } = CONFIG;

const common = new Common();
const db = new DB({ DATABASE, common });
const mediator = new Mediator(CONFIG.MEDIATOR);
const answer = new Answer();

const gameManager = new GameManager( { mediator, db, common, io, answer } );
const userManager = new UserManager({ mediator, db, common, io, answer });
const chatManager = new ChatManager({ mediator, common, io, answer });
const lobbyManager = new LobbyManager({ mediator, common, db, io, answer });


app.use((_, res, next) => {
    res.header('Content-Type', 'application/json; charset=utf-8');
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(`${__dirname}/public`));
app.use('/', new Router({ mediator, answer }));

function deinit() {
    db.destructor();
    setTimeout(() => process.exit(), 500);
}

const startLog = `${NAME} started at port ${PORT} \nYou can connect to server ONLY from CORS: \n ${CONFIG.CORS.origin}`;

server.listen(PORT, () => console.log(startLog));

process.on('SIGNINT', deinit);