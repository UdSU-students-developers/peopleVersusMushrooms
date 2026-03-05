const express = require('express');
const app = express();
const CONFIG = require('./config');
const Router = require('./application/router/Router');
const DB = require('./application/modules/db/DB');
const Mediator = require('./application/modules/mediator/Mediator');
const RegistrationManager = require('./application/modules/registration/RegistrationManager')
const { NAME, PORT, DATABASE } = CONFIG;

const db = new DB({ DATABASE });
const mediator = new Mediator(CONFIG.MEDIATOR);

// Менеджеры создаём здесь, чтобы они зарегистрировали триггеры в медиаторе
const registrationManager = new RegistrationManager(mediator, db);

// Пример: подписка на событие "пользователь зарегистрирован"
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

app.listen(PORT, () => console.log(`${NAME} started at port ${PORT}`));

process.on('SIGINT', deinit);