import CONFIG from './config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import Router from './application/router/Router';
import DB from './application/modules/db/DB';
import Mediator from './application/modules/mediator/Mediator';
import Answer from './application/Answer';
import UserManager from './application/modules/user/UserManager';
import Common from './application/modules/common/Common';

const { NAME, PORT, DATABASE } = CONFIG;

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, { cors: CONFIG.CORS });

const db = new DB({ DATABASE });
const mediator = new Mediator(CONFIG.MEDIATOR);
const common = new Common();
const answer = new Answer();

new UserManager({ mediator, db, common, io, answer });

app.use(express.static(`${__dirname}/public`));
app.use('/', Router({ answer }));

function deinit(): void {
    db.destructor();
    setTimeout(() => process.exit(), 500);
}

const startLog = `${NAME} started at port ${PORT}`;

server.listen(PORT, () => console.log(startLog));

process.on('SIGINT', deinit);