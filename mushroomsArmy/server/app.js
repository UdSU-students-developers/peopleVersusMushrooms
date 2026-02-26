const express = require('express');
const app = express();
const CONFIG = require('./config');
const Router = require('./application/router/Router');
const DB = require('./application/modules/db/DB');
const Mediator = require('./application/modules/mediator/Mediator');
const ExampleManager = require('./application/modules/exampleModule/ExampleManager')
const { NAME, PORT, DATABASE } = CONFIG;

const db = new DB({ DATABASE });
const mediator = new Mediator(CONFIG.MEDIATOR);

const exampleManager = new ExampleManager(mediator, db);

const router = new Router({ exampleManager });

app.use(express.static(`${__dirname}/public`));
app.use('/', router);

function deinit() {
    db.destrucor();
    setTimeout(() =>process.exit(), 500);
}

app.listen(PORT, () => console.log(`${NAME} started at port ${PORT}`));

process.on('SIGNINT', deinit);