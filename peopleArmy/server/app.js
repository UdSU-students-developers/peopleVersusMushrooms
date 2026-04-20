const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
// global imports
const LobbyManager = require('../../global/modules/lobby/LobbyManager');
// config
// answer
// mediator
// UserManager
// db

// local imports
const CONFIG = require('./config');
const Router = require('./application/router/Router');
const Answer = require('./application/Answer');
const Common = require('./application/modules/common/Common');
const DB = require('./application/modules/db/DB');
const Mediator = require('./application/modules/mediator/Mediator');
const ChatManager = require('./application/modules/chat/ChatManager');
const ArmyManager = require('./application/modules/army/ArmyManager');
const UserManager = require('./application/modules/user/UserManager');
const { NAME, PORT, DATABASE, ROLE } = CONFIG;

// Создаем сокеты в app.js
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3006",
    }
});

const answer = new Answer();
const common = new Common();
const db = new DB({ DATABASE });
const mediator = new Mediator(CONFIG.MEDIATOR);

// Менеджеры создаём здесь, чтобы они зарегистрировали триггеры в медиаторе
new UserManager({ mediator, db, io, common, answer });
new ChatManager({ mediator, db, io, common, answer });
new ArmyManager({ mediator, db, io, common, answer });
new LobbyManager({ mediator, db, io, common, answer }, ROLE);


app.use(CONFIG.CORS.middleware);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(`${__dirname}/public`));
app.use('/', new Router(mediator, answer));

function deinit() {
    armyManager.destructor();
    db.destructor();
    setTimeout(() => process.exit(), 500);
}

server.listen(PORT, () => console.log(`${NAME} started at port ${PORT}`));

process.on('SIGINT', deinit);