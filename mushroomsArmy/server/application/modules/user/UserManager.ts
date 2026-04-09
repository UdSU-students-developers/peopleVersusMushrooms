import { Socket } from 'socket.io';
import BaseManager, { TManagerOptions } from '../BaseManager';
import CONFIG from '../../../config';
import User from './User';

const { REGISTRATION, LOGIN, LOGOUT, LOBBY_START, VALIDATE_TOKEN } = CONFIG.SOCKET;
const { START_GAME } = CONFIG.MEDIATOR.EVENTS;
const { GET_USER_BY_GUID } = CONFIG.MEDIATOR.TRIGGERS;

class UserManager extends BaseManager {
    private users: { [guid: string]: User };

    constructor(options: TManagerOptions) {
        super(options);
        this.users = {}; // Ключ guid значение new User

        // Триггер: вернуть пользователя по guid
        this.mediator.set(GET_USER_BY_GUID, (guid: string) => this.users[guid] || null);

        if (!this.io) return;

        this.io.on('connection', (socket: Socket) => {
            socket.on(REGISTRATION, (data) => this.socketRegistration(data, socket));
            socket.on(LOGIN, (data) => this.socketLogin(data, socket));
            socket.on(LOGOUT, (data) => this.socketLogout(data, socket));
            socket.on(LOBBY_START, (data) => this.socketLobbyStart(data, socket));
            socket.on(VALIDATE_TOKEN, (data) => this.socketValidateToken(data, socket));

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

    private async socketRegistration(data: { name?: string; password?: string; passwordRepeat?: string } = {}, socket: Socket): Promise<void> {
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

        socket.emit(REGISTRATION, this.answer.good(user.toClient()));
    }

    private async socketLogin(data: { name?: string; password?: string } = {}, socket: Socket): Promise<void> {
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
            socket.emit(LOGIN, this.answer.good(user.toClient()));
            return;
        }

        socket.emit(LOGIN, this.answer.bad(11));
    }

    private async socketLogout(data: { token?: string; guid?: string } = {}, socket: Socket): Promise<void> {
        const { token, guid } = data;

        if (!token || !guid) {
            socket.emit(LOGOUT, this.answer.bad(13));
            return;
        }

        const user = this.users[guid];
        if (user) {
            await user.logout();
            delete this.users[user.getSelf().guid!];
        }

        socket.emit(LOGOUT, this.answer.good(true));
    }

    private async socketLobbyStart(data: { guid?: string; token?: string } = {}, socket: Socket): Promise<void> {
        const { guid, token } = data;

        if (!guid || !token || !this.users[guid]) {
            socket.emit(LOBBY_START, this.answer.bad(10));
            return;
        }

        const user = this.users[guid];
        if (user.getSelf().token !== token) {
            socket.emit(LOBBY_START, this.answer.bad(10));
            return;
        }

        user.setSocketId(socket.id);

        // Захардкоженная карта 50×50: 0=равнина, 1=вода, 2=горы
        const map: (number | null)[][] = Array.from({ length: 50 }, (_row, row) =>
            Array.from({ length: 50 }, (_col, col) => {
                if (col === 10) return 1; // полоса воды
                return 0;
            })
        );

        // Тестовые здания людей (цели для армии грибов)
        const buildings = [
            { guid: this.common.guid(), type: 'house', x: 35, y: 15, hp: 200, maxHp: 200 },
            { guid: this.common.guid(), type: 'barracks', x: 40, y: 25, hp: 300, maxHp: 300 },
            { guid: this.common.guid(), type: 'tower', x: 38, y: 35, hp: 150, maxHp: 150 },
            { guid: this.common.guid(), type: 'sporovaya_bashnya', x: 12, y: 12, hp: 250, maxHp: 250, sizeX: 2, sizeY: 2 },
            { guid: this.common.guid(), type: 'sporovaya_bashnya', x: 16, y: 18, hp: 250, maxHp: 250, sizeX: 2, sizeY: 2 },
        ];

        const mapGuid = this.common.guid();

        socket.emit(LOBBY_START, this.answer.good(true));

        this.mediator.call(START_GAME, { guid, map, buildings, mapGuid });
    }

    private async socketValidateToken(data: { token?: string } = {}, socket: Socket): Promise<void> {
        const { token } = data;

        if (!token) {
            socket.emit(VALIDATE_TOKEN, this.answer.bad(13));
            return;
        }

        // Сначала проверяем в памяти
        const cachedUser = Object.values(this.users).find((item) => item.getSelf().token === token);
        if (cachedUser) {
            socket.emit(VALIDATE_TOKEN, this.answer.good(cachedUser.toClient()));
            return;
        }

        // Если нет в памяти — восстанавливаем из БД (например, после перезагрузки страницы)
        const userData = await this.db.getUserByValidToken(token);
        if (userData) {
            const user = User.restoreFromData(
                { db: this.db, common: this.common, socketId: socket.id },
                userData
            );
            this.users[user.getSelf().guid!] = user;
            socket.emit(VALIDATE_TOKEN, this.answer.good(user.toClient()));
            return;
        }

        socket.emit(VALIDATE_TOKEN, this.answer.bad(10));
    }
}

export default UserManager;