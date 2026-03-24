import { Socket } from 'socket.io';
import BaseManager from '../BaseManager';
import CONFIG from '../../../config';
import User from './User';

const { REGISTRATION, LOGIN, LOGOUT } = CONFIG.SOCKET;

interface UserManagerOptions {
    mediator: any;
    db: any;
    io: any;
    answer: any;
    common: any;
}

class UserManager extends BaseManager {
    private users: { [guid: string]: User };

    constructor(options: UserManagerOptions) {
        super(options);
        this.users = {}; // Ключ guid значение new User

        if (!this.io) return;

        this.io.on('connection', (socket: Socket) => {
            socket.on(REGISTRATION, (data) => this.socketRegistration(data, socket));
            socket.on(LOGIN, (data) => this.socketLogin(data, socket));
            socket.on(LOGOUT, (data) => this.socketLogout(data, socket));

            socket.on('disconnect', () => console.log('disconnect', socket.id));
        });
    }

    private validateLogin(name: string): boolean {
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

    private validatePassword(password: string): boolean {
        // Пароль от 6 до 50 символов
        return !!(password && password.length >= 6 && password.length <= 50);
    }

    private async socketRegistration(data: any = {}, socket: Socket): Promise<void> {
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

        const user = new User({ db: this.db, common: this.common, socketId: socket.id });
        await user.registration(name, password);
        this.users[user.getSelf().guid!] = user;

        socket.emit(REGISTRATION, this.answer.good(user.getSelf()));
    }

    private async socketLogin(data: any = {}, socket: Socket): Promise<void> {
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

        const user = new User({ db: this.db, common: this.common, socketId: socket.id });
        if (await user.login(name, password)) {
            this.users[user.getSelf().guid!] = user;
            socket.emit(LOGIN, this.answer.good(user.getSelf()));
            return;
        }

        socket.emit(LOGIN, this.answer.bad(11));
    }

    private async socketLogout(data: any = {}, socket: Socket): Promise<void> {
        const { token, guid } = data;

        if (!token) {
            socket.emit(LOGOUT, this.answer.bad(13));
            return;
        }

        const user = this.users[guid];
        if (user) {
            user.logout();
            delete this.users[user.getSelf().guid!];
        }

        socket.emit(LOGOUT, this.answer.good(true));
    }
}

export default UserManager;