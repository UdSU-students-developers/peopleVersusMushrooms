const CONFIG = require('./config');

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, { cors: CONFIG.CORS });

const Router = require('./application/router/Router');
const DB = require('./application/modules/db/DB');
const Mediator = require('./application/modules/mediator/Mediator');
const Answer = require('./application/Answer');
const UserManager = require('./application/modules/user/UserManager');
const Common = require('./application/modules/common/Common');

const { NAME, PORT, DATABASE } = CONFIG;

const db = new DB({ DATABASE });
const mediator = new Mediator(CONFIG.MEDIATOR);
const common = new Common();
const answer = new Answer();

new UserManager({ mediator, db, common, io, answer });

app.use(express.static(`${__dirname}/public`));
app.use('/', new Router({ answer }));

function deinit() {
    db.destructor();
    setTimeout(() => process.exit(), 500);
}

const startLog = `${NAME} started at port ${PORT}`;

server.listen(PORT, () => console.log(startLog));

process.on('SIGINT', deinit);

