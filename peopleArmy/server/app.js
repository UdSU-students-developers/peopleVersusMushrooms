const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const CONFIG = require('./config');
const Router = require('./application/router/Router');
const Common = require('./application/modules/common/Common');
const DB = require('./application/modules/db/DB');
const Mediator = require('./application/modules/mediator/Mediator');
const RegistrationManager = require('./application/modules/registration/RegistrationManager')
const ChatManager = require('./application/modules/chat/ChatManager');
const UserManager = require('./application/modules/UserManager/UserManager');
const { NAME, PORT, DATABASE } = CONFIG;

// Создаем сокеты в app.js
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3006",
    }
});

const common = new Common();
const db = new DB({ DATABASE });
const mediator = new Mediator(CONFIG.MEDIATOR);

new UserManager({
    io,
    db,
    mediator,
    DATABASE 
});
new RegistrationManager({mediator, db, io, common});
new ChatManager({mediator, db, io, common});


mediator.subscribe(mediator.EVENTS.USER_REGISTERED, (user) => {
    console.log(`[Mediator] Новый пользователь: ${user.username}`);
});

const router = new Router(mediator);

app.use(express.static(`${__dirname}/public`));
app.use('/', router);

function deinit() {
    db.destructor();
    setTimeout(() =>process.exit(), 500);
}

server.listen(PORT, () => console.log(`${NAME} started at port ${PORT}`));

process.on('SIGINT', deinit);