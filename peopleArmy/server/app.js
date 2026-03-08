const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const CONFIG = require('./config');
const Router = require('./application/router/Router');
const DB = require('./application/modules/db/DB');
const Mediator = require('./application/modules/mediator/Mediator');
const RegistrationManager = require('./application/modules/registration/RegistrationManager')
const SocketManager = require('./application/modules/socket/SocketManager');
const { NAME, PORT, DATABASE } = CONFIG;

const db = new DB({ DATABASE });
const mediator = new Mediator(CONFIG.MEDIATOR);

// Менеджеры создаём здесь, чтобы они зарегистрировали триггеры в медиаторе
const registrationManager = new RegistrationManager(mediator, db);
const socketManager = new SocketManager(mediator, CONFIG);

// Пример: подписка на событие "пользователь зарегистрирован"
mediator.subscribe(mediator.EVENTS.USER_REGISTERED, (user) => {
    console.log(`[Mediator] Новый пользователь: ${user.username}`);
});

const router = new Router(mediator);

app.use(express.static(`${__dirname}/public`));
app.use('/', router);

// Инициализация сокетов
socketManager.initialize(server);

function deinit() {
    db.destructor();
    setTimeout(() =>process.exit(), 500);
}

server.listen(PORT, () => console.log(`${NAME} started at port ${PORT}`));

process.on('SIGINT', deinit);