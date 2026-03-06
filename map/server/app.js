const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3000",
    }
});

const Router = require('./application/router/Router.js');
const DB = require('./application/modules/db/DB.js');
const Mediator = require('./application/modules/Mediator.js');
const Common = require('./application/modules/common/Common.js');
const UserManager = require('./application/modules/user/UserManager.js');
const { EVENTS, TRIGGERS, SERVER_PORT, SERVER_NAME } = require('./config.js');

/*
app.use((_, res, next) => {
    res.header('Content-Type', 'application/json; charset=utf-8');
    res.header('Access-Control-Allow-Origin', '*');
    next();
});
    
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
*/

// Экз БД
const db = new DB();
// Создание медиатора
const mediator = new Mediator({ EVENTS, TRIGGERS });
const common = new Common();
// Создаем менеджеры
new UserManager({ mediator, db, common, io });

/*//для тестов
app.use(express.static('public'));
*/

// Создаем роутер
const router = new Router(mediator);
app.use('/', router);


// Запуск сервака
server.listen(SERVER_PORT, () => {
    console.log(`Server ${SERVER_NAME} running on port ${SERVER_PORT}`);
});


