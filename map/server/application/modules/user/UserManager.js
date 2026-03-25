const { MESSAGES } = require("../../../config");
const BaseManager = require("../BaseManager");
const User = require("./User");

class UserManager extends BaseManager {
    constructor(options) {
        super(options);
        
        this.users = new Map();
        this.socketToUser = new Map();

        if (!this.io) return;

        this.io.on('connection', (socket) => {
            console.log(`Пользователь подключился к UserManager с id ${socket.id}`);

            socket.on(MESSAGES.REGISTRATION, (data) => this.socketRegistration(data, socket));
            socket.on(MESSAGES.LOGIN, (data) => this.socketLogin(data, socket));
            socket.on(MESSAGES.LOGOUT, () => this.socketLogout(socket));
            socket.on(MESSAGES.CHECK, (data) => this.socketCheck(data, socket));
            socket.on('disconnect', () => this.socketDisconnect(socket));
        });
    }

    // ============ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ============
    
    getUserByToken(token) {
        for (const user of this.users.values()) {
            if (user.token === token) {
                return user;
            }
        }
        return null;
    }

    getUserByGuid(guid) {
        return this.users.get(guid) || null;
    }

    getUserBySocketId(socketId) {
        const guid = this.socketToUser.get(socketId);
        return guid ? this.users.get(guid) : null;
    }

    // ============ СОКЕТ МЕТОДЫ ============

    async socketRegistration(data = {}, socket) {
        const { login, passwordHash, nickname } = data;
        
        // валидация
        if (!login || !passwordHash) {
            return socket.emit(MESSAGES.REGISTRATION, this.answer.bad(242));
        }

        // проверка на существование
        const existingUser = await this.db.getUserByLogin(login);
        if (existingUser) {
            return socket.emit(MESSAGES.REGISTRATION, this.answer.bad(1003));
        }

        // создаем пользователя
        const user = new User({ 
            db: this.db, 
            common: this.common, 
            socketId: socket.id 
        });
        
        await user.registration(login, passwordHash, nickname);
        
        // сохраняем
        this.users.set(user.guid, user);
        this.socketToUser.set(socket.id, user.guid);

        console.log(`Сокет ${socket.id} зарегистрировался как пользак ${user.guid}`);
        socket.emit(MESSAGES.REGISTRATION, this.answer.good(user.getSelf()));
    }

    async socketLogin(data = {}, socket) {
        const { login, passwordHash } = data;
        
        // валидация
        if (!login || !passwordHash) {
            return socket.emit(MESSAGES.LOGIN, this.answer.bad(242));
        }

        // создаем временного пользователя для логина
        const user = new User({ 
            db: this.db, 
            common: this.common, 
            socketId: socket.id 
        });
        
        const loggedInUser = await user.loginUser(login, passwordHash);
        
        if (!loggedInUser) {
            return socket.emit(MESSAGES.LOGIN, this.answer.bad(1002));
        }

        // сохраняем
        this.users.set(user.guid, user);
        this.socketToUser.set(socket.id, user.guid);

        console.log(`Сокет ${socket.id} авторизован как пользак ${user.guid}`);
        socket.emit(MESSAGES.LOGIN, this.answer.good(user.getSelf()));
    }

    async socketLogout(socket) {
        const user = this.getUserBySocketId(socket.id);
        
        if (!user) {
            console.log(`Увы! Неудачная попытка логаута неавторизованного сокета ${socket.id}`);
            return socket.emit(MESSAGES.LOGOUT, this.answer.bad(1001));
        }

        await user.logout();
        
        // удаляем из всех хранилищ
        this.users.delete(user.guid);
        this.socketToUser.delete(socket.id);

        console.log(`Пользак ${user.guid} вышел (сокет ${socket.id})`);
        socket.emit(MESSAGES.LOGOUT, this.answer.good(true));
    }

    socketCheck(data = {}, socket) {
        const { name, text } = data;
        
        // ок
        socket.emit(MESSAGES.CHECK, this.answer.good('ok'));
        
        // рассылка всем
        this.io.emit(MESSAGES.SEND_TO_ALL, this.answer.good({ 
            name: name || 'anonymous',
            text: text || '',
            timestamp: Date.now(),
            fromSocket: socket.id
        }));
    }

    socketDisconnect(socket) {
        const user = this.getUserBySocketId(socket.id);
        
        if (user) {
            console.log(`Пользак ${user.guid} отключился от сокета ${socket.id}`);
            this.socketToUser.delete(socket.id);
        } else {
            console.log(`Анонимус отключился от сокета ${socket.id}`);
        }
    }
}

module.exports = UserManager;