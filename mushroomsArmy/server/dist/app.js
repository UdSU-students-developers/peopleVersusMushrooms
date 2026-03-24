"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("./config"));
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const Router_1 = __importDefault(require("./application/router/Router"));
const DB_1 = __importDefault(require("./application/modules/db/DB"));
const Mediator_1 = __importDefault(require("./application/modules/mediator/Mediator"));
const Answer_1 = __importDefault(require("./application/Answer"));
const UserManager_1 = __importDefault(require("./application/modules/user/UserManager"));
const Common_1 = __importDefault(require("./application/modules/common/Common"));
const { NAME, PORT, DATABASE } = config_1.default;
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, { cors: config_1.default.CORS });
const db = new DB_1.default({ DATABASE });
const mediator = new Mediator_1.default(config_1.default.MEDIATOR);
const common = new Common_1.default();
const answer = new Answer_1.default();
new UserManager_1.default({ mediator, db, common, io, answer });
app.use(express_1.default.static(`${__dirname}/public`));
app.use('/', (0, Router_1.default)({ answer }));
function deinit() {
    db.destructor();
    setTimeout(() => process.exit(), 500);
}
const startLog = `${NAME} started at port ${PORT}`;
server.listen(PORT, () => console.log(startLog));
process.on('SIGINT', deinit);
//# sourceMappingURL=app.js.map