const BaseManager = require('../BaseManager');
const CONFIG = require('../../../config');
const User = require('./User');

const { REGISTRATION, LOGIN, LOGOUT } = CONFIG.SOCKET;

class UserManager extends BaseManager {
    constructor(options) {
        super(options);
        this.users = {}; // Ключ guid значение new User

        if (!this.io) return;

        this.io.on('connection', (socket) => {
            socket.on(REGISTRATION, (data) => this.socketRegistration(data, socket));
            socket.on(LOGIN, (data) => this.socketLogin(data, socket));
            socket.on(LOGOUT, (data) => this.socketLogout(data, socket));

            socket.on('disconnect', () => console.log('disconnect', socket.id));
        });
    }

    validateLogin(name) {
        // Логин от 3 до 20 символов
        if (!name || name.length < 3 || name.length > 20) {
            return false;
        }
        // Допустимы латинские буквы, цифры, символы подчёркивания и точки
        // Логин не может начинаться или заканчиваться точкой, не может содержать две точки подряд
        const loginRegex = /^[a-zA-Z0-9_]([a-zA-Z0-9_.]*[a-zA-Z0-9_])?$/;
        if (!loginRegex.test(name)) {
            return false;
        }
        // Проверка на две точки подряд и начало/конец на точку
        if (name.includes('..') || name.startsWith('.') || name.endsWith('.')) {
            return false;
        }
        return true;
    }

    validatePassword(password) {
        // Пароль от 6 до 50 символов
        return password && password.length >= 6 && password.length <= 50;
    }

    async socketRegistration(data = {}, socket) {
        const { name, password, passwordRepeat } = data;
        
        if (!name || !password || !passwordRepeat) {
            return socket.emit(REGISTRATION, this.answer.bad(13));
        }

        if (!this.validateLogin(name)) {
            return socket.emit(REGISTRATION, this.answer.bad(13));
        }

        if (!this.validatePassword(password)) {
            return socket.emit(REGISTRATION, this.answer.bad(13));
        }

        if (password !== passwordRepeat) {
            return socket.emit(REGISTRATION, this.answer.bad(13));
        }

        if (await this.db.getUserByName(name)) {
            return socket.emit(REGISTRATION, this.answer.bad(17));
        }

        const user = new User({ db: this.db, common: this.common, socketId: socket.id });
        await user.registration(name, password);
        this.users[user.guid] = user;

        socket.emit(REGISTRATION, this.answer.good(user.getSelf()));
    }

    async socketLogin(data = {}, socket) {
        const { name, password } = data;
        
        if (!name || !password) {
            return socket.emit(LOGIN, this.answer.bad(13));
        }

        if (!this.validateLogin(name)) {
            return socket.emit(LOGIN, this.answer.bad(13));
        }

        if (!this.validatePassword(password)) {
            return socket.emit(LOGIN, this.answer.bad(13));
        }

        const user = new User({ db: this.db, common: this.common, socketId: socket.id });
        if (await user.login(name, password)) {
            this.users[user.guid] = user;
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
        if (user) {
            await user.logout();
            delete this.users[user.guid];
        }

        socket.emit(LOGOUT, this.answer.good(true));
    }
}

module.exports = UserManager;
