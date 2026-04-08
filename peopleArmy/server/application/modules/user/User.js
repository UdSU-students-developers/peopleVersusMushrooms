/**
 * Модель текущего пользователя (сессия/активная запись).
 * Используется для логина, проверки токена и отдачи данных пользователя (get / getSelf).
 */
class User {
    constructor({ db, common, socketId }) {
        this.db = db;
        this.common = common;
        // from DB
        this.username;
        this.id;
        this.guid;
        this.token;
        // other data
        this.socketId = socketId;
    }

    get() {
        return {
            username: this.username,
            guid: this.guid,
        };
    }

    getSelf() {
        return {
            ...this.get(),
            token: this.token,
        };
    }

    async fillData({ id, username, guid }) {
        this.username = username;
        this.id = id;
        this.guid = guid;
        const token = this.common.md5Random();
        await this.db.updateToken(this.id, token);
        this.token = token;
    }

    async registration(username, password) {
        const data = await this.db.getUserByName(username);
        if (data) {
            return false;
        }
        await this.db.registration(username, password, this.common.guid());
        return await this.login(username, password);
    }

    async login(username, password) {
        const data = await this.db.getUserByName(username);
        if (!data) {
            return false;
        }
        if (password !== data.password) {
            return false;
        }
        await this.fillData(data);
        return true;
    }

    async logout() {
        this.token = null;
        await this.db.updateToken(this.id, null);
    }

    isLogin() {
        return this.token && this.socketId;
    }
}

module.exports = User;
