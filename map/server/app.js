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
const TestManager = require('./application/modules/test/TestManager.js');
const { EVENTS, TRIGGERS, SERVER_PORT, SERVER_NAME } = require('./config.js');

// Экз БД
const db = new DB();
// Создание медиатора
const mediator = new Mediator({ EVENTS, TRIGGERS });

// Создаем менеджеры
new TestManager({ mediator, db, io });

// Запуск сервака
server.listen(SERVER_PORT, () => {
    console.log(`Server ${SERVER_NAME} running on port ${SERVER_PORT}`);
});


// настройка http запросов
/*
    app.use((_, res, next) => {
        res.header('Content-Type', 'application/json; charset=utf-8');
        res.header('Access-Control-Allow-Origin', '*');
        next();
    });
    
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Создаем роутер
    const router = new Router(mediator);
    app.use('/', router);
*/