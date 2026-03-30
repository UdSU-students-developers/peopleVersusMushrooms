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
const Answer = require('./application/router/Answer.js');
const UserManager = require('./application/modules/user/UserManager.js');
const LobbyManager = require('./application/modules/lobby/LobbyManager.js');
const { EVENTS, TRIGGERS, SERVER_PORT, SERVER_NAME } = require('./config.js');
const MapManager = require('./application/modules/map/MapManager.js');

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
const answer = new Answer();
// Создаем менеджеры
const userManager = new UserManager({ mediator, db, common, answer, io });
const lobbyManager = new LobbyManager({ mediator, db, common, answer, io, userManager });
const mapManager = new MapManager({ mediator, db, common, answer, io })


//для тестов
app.use(express.static('public'));


// Создаем роутер
const router = new Router(mediator, answer);
app.use('/', router);


// Запуск сервака
server.listen(SERVER_PORT, () => {
    console.log(`Server ${SERVER_NAME} running on port ${SERVER_PORT}`);
});