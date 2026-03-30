const { MESSAGES, TRIGGERS } = require("../../../config");
const BaseManager = require("../BaseManager");
const User = require("./User");

class UserManager extends BaseManager {
    constructor(options) {
        super(options);
        
        this.users = new Map();
        this.socketToUser = new Map();

        //sockets
        if (!this.io) return;
        this.io.on('connection', (socket) => {
            socket.on(MESSAGES.REGISTRATION, (data) => this.socketRegistration(data, socket));
            socket.on(MESSAGES.LOGIN, (data) => this.socketLogin(data, socket));
            socket.on(MESSAGES.LOGOUT, () => this.socketLogout(socket));
            socket.on('disconnect', () => this.socketLogout(socket));
        });
        //mediator triggers
        this.mediator.set(this.TRIGGERS.GET_USER_BY_GUID, (guid) => this.triggerGetUserByGuid(guid));
    }

    // ============ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ============
    
    getUserByKey(name, value) {
        if (!name || !value) {
            return null;
        }
        for (const user of this.users.values()) {
            if (user[name] === value) {
                return user;
            }
        }
        return null;
    }

    getUserByToken(token) {
        return this.getUserByKey('token', token);
    }

    getUserBySocketId(socketId) {
        return this.getUserByKey('socketId', socketId);
    }

    getUserByGuid(guid) {
        return this.users.get(guid) || null;
    }
    // ============ TRIGGERS ============

    triggerGetUserByGuid(guid) {
        const user = this.getUserByGuid(guid);
        if (user && user.isLogin()) {
            return user;
        }
        return null;
    }

    // ============ SOCKETS ============

    async socketRegistration(data = {}, socket) {
        const { login, passwordHash} = data;
        
        // валидация
        if (!login || !passwordHash) {
            return socket.emit(MESSAGES.REGISTRATION, this.answer.bad(242));
        }

        // создаем пользователя
        const user = new User({ 
            db: this.db, 
            common: this.common, 
            socketId: socket.id 
        });
        
        if (await user.registration(login, passwordHash)) {
            // сохраняем
            this.users.set(user.guid, user);
            return socket.emit(MESSAGES.REGISTRATION, this.answer.good(user.getSelf()));
        }
        
        return socket.emit(MESSAGES.REGISTRATION, this.answer.bad(1003));
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
        
        if (!await user.loginUser(login, passwordHash)) {
            return socket.emit(MESSAGES.LOGIN, this.answer.bad(1002));
        }

        // сохраняем
        this.users.set(user.guid, user);
        socket.emit(MESSAGES.LOGIN, this.answer.good(user.getSelf()));
    }

    async socketLogout(socket) {
        const user = this.getUserBySocketId(socket.id);
        
        if (!user) {
            return socket.emit(MESSAGES.LOGOUT, this.answer.bad(1001));
        }

        this.mediator.call(this.EVENTS.LOGOUT, user.guid);
        await user.logout();
        
        // удаляем из всех хранилищ
        this.users.delete(user.guid);
        socket.emit(MESSAGES.LOGOUT, this.answer.good(true));
    }

}

module.exports = UserManager;