const md5 = require('md5');

/**
 * Модель текущего пользователя (сессия/активная запись).
 * Используется для логина, проверки токена и отдачи данных пользователя (get / getSelf).
 */
class User {
    constructor(db) {
        this.db = db;
        this.username = undefined;
        this.id = undefined;
        this.token = undefined;
    }

    get() {
        return {
            username: this.username,
            id: this.id,
        };
    }

    getSelf() {
        return {
            ...this.get(),
            token: this.token,
        };
    }

    init({ id, username, token }) {
        this.username = username;
        this.id = id;
        this.token = token;
    }

    async login(username, password) {
        const data = await this.db.getUserByName(username);
        if (!data) return false;
        if (password !== data.password) return false;

        const token = md5(`${Date.now()}-${Math.random()}`);
        await this.db.updateToken(data.id, token);
        this.init({ ...data, token });
        return true;
    }

    checkToken(token) {
        return this.token === token;
    }
}

module.exports = User;
