//GLOBAL
const GLOBAL_CONFIG = require('../../global/globalConfig');
const DB = require('../../global/modules/db/DB');
const Mediator = require('../../global/modules/Mediator');
const Answer = require('../../global/Answer');
const UserManager = require('../../global/modules/user/UserManager');
const Common = require('../../global/modules/common/Common');
const LobbyManager = require('../../global/modules/lobby/LobbyManager');

//LOCAL
const CONFIG = require('./config');

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {cors: GLOBAL_CONFIG.CORS});

const Router = require('./application/router/Router');
const GameManager = require('./application/modules/game/GameManager');
const ChatManager = require('./application/modules/chat/ChatManager');

const { NAME, PORT } = CONFIG;
const { DATABASE } = GLOBAL_CONFIG

const common = new Common();
const db = new DB({ DATABASE, common });
const mediator = new Mediator(CONFIG.MEDIATOR);
const answer = new Answer();

new GameManager( { mediator, db, io, answer, common } );
new UserManager( { mediator, db, io, answer, common } );
new ChatManager( { mediator, db, io, answer, common } );
new LobbyManager( { mediator, db, io, answer, common } );


app.use(GLOBAL_CONFIG.CORS.middleware);

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