const { MESSAGES } = require("../../../config");
const BaseManager = require("../BaseManager");
const User = require("./User");

class UserManager extends BaseManager {
    constructor(options) {
        super(options);
        this.users = {};
        this.socketToUser = {};

        if (!this.io) return;
        // Устанавливаем обработчик socket.io запросов
        this.io.on('connection', socket => {
            console.log(`Пользователь подключился с id ${socket.id}`);

            socket.on(MESSAGES.LOGIN, data => this.socketLogin(data, socket));
            socket.on(MESSAGES.REGISTRATION, data => this.socketRegistration(data, socket));
            socket.on(MESSAGES.LOGOUT, () => this.socketLogout(socket));
            socket.on(MESSAGES.CHECK, data => this.socketCheck(data, socket));
            socket.on('disconnect', () => this.socketDisconnect(socket));
        });

        // Устанавливаем обработчики для триггеров
        this.mediator.set(this.TRIGGERS.LOGIN, (params) => this.login(params));
        this.mediator.set(this.TRIGGERS.REGISTRATION, (params) => this.registration(params));
        this.mediator.set(this.TRIGGERS.LOGOUT, (params) => this.logout(params));
    }

    /*
    async getUserByToken(token) {
        for (let key in this.users) {
            const user = this.users[key];
            if (user.checkToken(token)) {
                return user;
            }
        }
        return null;
    }
    */

     // ============ HTTP METHODS ============
    async login(params) {
        const { login, passwordHash } = params;

        const user = new User(this.db, this.common);
        const result = await user.loginUser(login, passwordHash);
        if (result && result.error) {
            return { error: result.error };
        }
        this.users[user.guid] = user;
        return user.getSelf();
    }

    async registration(params) {
        const { login, passwordHash, nickname } = params;

        const user = new User(this.db, this.common);
        const result = await user.registration(login, passwordHash, nickname);
        if (result && result.error) {
            return { error: result.error };
        }
        this.users[user.guid] = user;
        return user.getSelf();
    }

    async logout(params) {
        const { token } = params;
        
        //поиска пользака в оперативе
        const user = Object.values(this.users).find(u => u.token === token);
        if (!user) {
            return { error: 1001 };
        }

        const result = await user.logout(token);
        
        if (result && result.error) {
            return { error: result.error };
        }

        delete this.users[user.guid];
        
        return true;
    }

     // ============ SOCKET METHODS ============

    async socketLogin(data, socket) {
        const { login, passwordHash } = data || {};
        
        if (!login || !passwordHash) {
            return socket.emit(MESSAGES.LOGIN, { 
                result: "error", 
                code: 242 
            });
        }

        const result = await this.login({ login, passwordHash });
        
        if (result.error) {
            console.log(`Ошибка авторизации через сокет ${socket.id}`);
            return socket.emit(MESSAGES.LOGIN, { 
                result: "error", 
                code: result.error 
            });
        }

        //сохрание связи сокета с пользаком
        this.socketToUser[socket.id] = result.guid;
        console.log(`Сокет ${socket.id} авторизован как пользак ${result.guid}`);
        socket.emit(MESSAGES.LOGIN, { 
            result: "ok", 
            data: result 
        });
    }

    async socketRegistration(data, socket) {
        const { login, passwordHash, nickname } = data || {};
        
        if (!login || !passwordHash) {
            return socket.emit(MESSAGES.REGISTRATION, { 
                result: "error", 
                code: 242 
            });
        }

        const result = await this.registration({ login, passwordHash, nickname });
        
        if (result.error) {
            console.log(`Ошибка регистрации через сокет ${socket.id}`);
            return socket.emit(MESSAGES.REGISTRATION, { 
                result: "error", 
                code: result.error 
            });
        }

        //сохрание связи сокета с пользаком
        this.socketToUser[socket.id] = result.guid;
        console.log(`Сокет ${socket.id} зарегистрировался как пользак ${result.guid}`);
        socket.emit(MESSAGES.REGISTRATION, { 
            result: "ok", 
            data: result 
        });
    }

    async socketLogout(socket) {
        const userGuid = this.socketToUser[socket.id];
        
        if (!userGuid) {
            console.log(`Увы! Неудачная попытка логаута неавторизованного сокета ${socket.id}`);
            return socket.emit(MESSAGES.LOGOUT, { 
                result: "error", 
                code: 1001 
            });
        }

        const user = this.users[userGuid];
        if (!user) {
            delete this.socketToUser[socket.id];
             console.log(`Логаут: пользак ${userGuid} не найден в памяти, сокет ${socket.id} очищен`);
            return socket.emit(MESSAGES.LOGOUT, { 
                result: "error", 
                code: 1001 
            });
        }

        const result = await user.logout(user.token);
        
        if (result && result.error) {
            console.log(`Ошибка логаута пользака ${userGuid}`);
            return socket.emit(MESSAGES.LOGOUT, { 
                result: "error", 
                code: result.error 
            });
        }

        delete this.users[userGuid];
        delete this.socketToUser[socket.id];
        
        console.log(`Пользак ${userGuid} отключился от сокета ${socket.id}`);
        socket.emit(MESSAGES.LOGOUT, { result: "ok" });
    }

    socketCheck(data, socket) {
        const { name, text } = data || {};
        
        //ок
        socket.emit(MESSAGES.CHECK, 'ok');
        
        //рассылка всем
        this.io.emit(MESSAGES.SEND_TO_ALL, { 
            name: name,
            text: text,
            timestamp: Date.now()
        });
    }

    socketDisconnect(socket) {
        const userGuid = this.socketToUser[socket.id];
        console.log(`Пользак ${userGuid} отключился от сокета ${socket.id})`);
        delete this.socketToUser[socket.id];
    }

}

module.exports = UserManager;