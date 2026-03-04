const express = require('express');
const app = express();
const CONFIG = require('./config');
const Router = require('./application/router/Router');
const DB = require('./application/modules/db/DB');
const Mediator = require('./application/modules/mediator/Mediator');
const RegistrationManager = require('./application/modules/exampleModule/RegistrationManager')
const { NAME, PORT, DATABASE } = CONFIG;

const db = new DB({ DATABASE });
const mediator = new Mediator(CONFIG.MEDIATOR);

const registrationManager = new RegistrationManager(mediator, db);

const allManagers = {
    registrationManager,
};

// Пример: подписка на событие "пользователь зарегистрирован"
mediator.subscribe(mediator.EVENTS.USER_REGISTERED, (user) => {
    console.log(`[Mediator] Новый пользователь: ${user.username}`);
});

const router = new Router(managers);

app.use(express.static(`${__dirname}/public`));
app.use('/', router);

function deinit() {
    db.destrucor();
    setTimeout(() =>process.exit(), 500);
}

app.listen(PORT, () => console.log(`${NAME} started at port ${PORT}`));

process.on('SIGNINT', deinit);