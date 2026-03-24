const BaseManager = require('../BaseManager');
const Common = require('../common/Common');
const Answer = require('../../Answer');
const CONFIG = require('../../../config');
const User = require('./User');
const {REGISTRATION, LOGIN, LOGOUT} = CONFIG.SOCKET;


class UserManager extends BaseManager {
    constructor(options) {
        super(options);
        this.common = new Common();
        this.answer = Answer;
        this.users = {};

        if (!this.io) return;
        this.io.on('connection', (socket) => {
            socket.on(REGISTRATION, (data) => this.socketRegistration(data, socket));
            socket.on(LOGIN, (data) => this.socketLogin(data, socket));
            socket.on(LOGOUT, (data) => this.socketLogout(data, socket));
        });
    }

    async socketRegistration(data = {}, socket) {
        const { name, password } = data;
        if (!name || !password) {
            return socket.emit(REGISTRATION, this.answer.bad(13));
        }

        if (await this.db.getUserByName(name)) {
            return socket.emit(REGISTRATION, this.answer.bad(17));
        }

        const user = new User({db: this.db, common: this.common, socketId: socket.id});
        await user.registration(name, password);
        this.users[user.id] = user;

        socket.emit(REGISTRATION, this.answer.good(user.getSelf()));
    }

    async socketLogin(data = {}, socket) {
        const { name, password } = data;
        if (!name || !password) {
            return socket.emit(LOGIN, this.answer.bad(13));
        }

        const user = new User(this.db);
        if (await user.login(name, password)) {
            this.users[user.id] = user;
            socket.emit(LOGIN, this.answer.good(user.getSelf()));
            return;
        }

        socket.emit(LOGIN, this.answer.bad(11));
    }

    async socketLogout(data = {}, socket) {
        const { token, guid } = data;

        if (!token) {
            return socket.emit(LOGOUT, this.answer.bad(13));
        }

        const user = this.users[guid];
        if (!user || !user.checkToken(token)) {
            return socket.emit(LOGOUT, this.answer.bad(11));
        }

        delete this.users[user.id];
        socket.emit(LOGOUT, this.answer.good(true));
    }
}

module.exports = UserManager;
