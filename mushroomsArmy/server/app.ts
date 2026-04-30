//GLOBAL
const GLOBAL_CONFIG = require('../../global/globalConfig');
const DB = require('../../global/modules/db/DB');
const Mediator = require('../../global/modules/Mediator');
const Answer = require('../../global/Answer');
const UserManager = require('../../global/modules/user/UserManager');
const Common = require('../../global/modules/common/Common');
const LobbyManager = require('../../global/modules/lobby/LobbyManager');

//LOCAL
import CONFIG from './config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import Router from './application/router/Router';
import ArmyManager from './application/modules/army/ArmyManager';

const { NAME, ROLE, PORT } = CONFIG;
const { DATABASES } = GLOBAL_CONFIG;

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, { cors: GLOBAL_CONFIG.CORS });

const common = new Common();
const db = new DB({ DATABASE: DATABASES.MUSHROOMS_ARMY });
const mediator = new Mediator(CONFIG.MEDIATOR);
const answer = new Answer();

new UserManager({ mediator, db, io, answer, common });
new ArmyManager({ mediator, db, common, io, answer });
new LobbyManager({ mediator, db, io, answer, common }, ROLE);

app.use(GLOBAL_CONFIG.CORS.middleware);

app.use((req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(`${__dirname}/public`));
app.use('/', Router({ answer, mediator }));

function deinit(): void {
    db.destructor();
    setTimeout(() => process.exit(), 500);
}

const startLog = `${NAME} started at port ${PORT}\nYou can connect to server ONLY from CORS: \n ${GLOBAL_CONFIG.CORS.origin}`;

server.listen(PORT, () => console.log(startLog));

process.on('SIGINT', deinit);