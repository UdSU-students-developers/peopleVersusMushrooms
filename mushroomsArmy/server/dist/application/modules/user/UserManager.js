"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseManager_1 = __importDefault(require("../BaseManager"));
const config_1 = __importDefault(require("../../../config"));
const User_1 = __importDefault(require("./User"));
const { REGISTRATION, LOGIN, LOGOUT } = config_1.default.SOCKET;
class UserManager extends BaseManager_1.default {
    constructor(options) {
        super(options);
        this.users = {}; // Ключ guid значение new User
        if (!this.io)
            return;
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
        return !!(password && password.length >= 6 && password.length <= 50);
    }
    async socketRegistration(data = {}, socket) {
        const { name, password, passwordRepeat } = data;
        if (!name || !password || !passwordRepeat) {
            socket.emit(REGISTRATION, this.answer.bad(13));
            return;
        }
        if (!this.validateLogin(name)) {
            socket.emit(REGISTRATION, this.answer.bad(13));
            return;
        }
        if (!this.validatePassword(password)) {
            socket.emit(REGISTRATION, this.answer.bad(13));
            return;
        }
        if (password !== passwordRepeat) {
            socket.emit(REGISTRATION, this.answer.bad(13));
            return;
        }
        if (await this.db.getUserByName(name)) {
            socket.emit(REGISTRATION, this.answer.bad(17));
            return;
        }
        const user = new User_1.default({ db: this.db, common: this.common, socketId: socket.id });
        await user.registration(name, password);
        this.users[user.getSelf().guid] = user;
        socket.emit(REGISTRATION, this.answer.good(user.getSelf()));
    }
    async socketLogin(data = {}, socket) {
        const { name, password } = data;
        if (!name || !password) {
            socket.emit(LOGIN, this.answer.bad(13));
            return;
        }
        if (!this.validateLogin(name)) {
            socket.emit(LOGIN, this.answer.bad(13));
            return;
        }
        if (!this.validatePassword(password)) {
            socket.emit(LOGIN, this.answer.bad(13));
            return;
        }
        const user = new User_1.default({ db: this.db, common: this.common, socketId: socket.id });
        if (await user.login(name, password)) {
            this.users[user.getSelf().guid] = user;
            socket.emit(LOGIN, this.answer.good(user.getSelf()));
            return;
        }
        socket.emit(LOGIN, this.answer.bad(11));
    }
    async socketLogout(data = {}, socket) {
        const { token, guid } = data;
        if (!token) {
            socket.emit(LOGOUT, this.answer.bad(13));
            return;
        }
        const user = this.users[guid];
        if (user) {
            user.logout();
            delete this.users[user.getSelf().guid];
        }
        socket.emit(LOGOUT, this.answer.good(true));
    }
}
exports.default = UserManager;
//# sourceMappingURL=UserManager.js.map