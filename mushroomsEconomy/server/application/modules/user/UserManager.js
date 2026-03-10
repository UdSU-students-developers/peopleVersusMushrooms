const crypto = require('node:crypto');
const BaseManager = require('../BaseManager');
const CONFIG = require('../../../config');
const User = require('./User');

class UserManager extends BaseManager {
    constructor(options) {
        super(options);
        this.answer = options.answer;
        this.users = new Map(); // Ключ guid значение new User

        if (!this.io) return;

        this.io = options.io;
        this.io.on('connection', (socket) => {

            socket.on(CONFIG.SOCKET.REGISTRATION, (data) => this.socketRegistration(data, socket));
            socket.on(CONFIG.SOCKET.LOGIN, (data) => this.socketLogin(data, socket));
            socket.on(CONFIG.SOCKET.LOGOUT, (data) => this.socketLogin(data, socket));

            socket.on('disconnect', () => console.log('disconnect', socket.id));
        });
    }

    async socketRegistration(data = {}, socket) {
        const { name, password } = data;
        if (!name || !password) {
            socket.emit(CONFIG.SOCKET.REGISTRATION, this.answer.bad(13));
        }

        if (await this.db.getUserByName(name)) {
            socket.emit(CONFIG.SOCKET.REGISTRATION, this.answer.bad(17));
        }

        const user = new User({db: this.db, socketId: socket.id});
        await user.registration(name, password);
        this.users.set(user.guid, user);

        socket.emit(CONFIG.SOCKET.REGISTRATION, this.answer.good(true));
    }

    async socketLogin(data = {}, socket) {
        const { name, password } = data;
        if (!name || !password) {
            socket.emit(CONFIG.SOCKET.LOGIN, this.answer.bad(13));
        }

        const user = new User({ db: this.db, socketId: socket.id });
        await user.login(name, password);

        if (!user) {
            socket.emit(CONFIG.SOCKET.LOGIN, this.answer.bad(16));
        }

        this.users.set(user.guid, user);

        socket.emit(CONFIG.SOCKET.LOGIN, this.answer.good(true));
    }

    async socketLogout(data = {}, socket) {
        const { token } = data;

        if (!token) {
            socket.emit(CONFIG.SOCKET.LOGOUT, this.answer.bad(13));
        }

        const user = this.users.get(guid);
        await user.logout();
        this.users.delete(user.guid);

        socket.emit(CONFIG.SOCKET.LOGOUT, this.answer.good(true));
    }
}

module.exports = UserManager;