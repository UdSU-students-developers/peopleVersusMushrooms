const md5 = require('md5');
const Common = require('../common/Common');
const common = new Common();

/**
 * Модель текущего пользователя (сессия/активная запись).
 * Используется для логина, проверки токена и отдачи данных пользователя (get / getSelf).
 */
class User {
    constructor(db) {
        this.db = db;
        this.username = undefined;
        this.id = undefined;
        this.guid = undefined;
        this.token = undefined;
    }

    get() {
        return {
            username: this.username,
            id: this.id,
            guid: this.guid,
        };
    }

    getSelf() {
        return {
            ...this.get(),
            token: this.token,
        };
    }

    init({ id, username, guid, token }) {
        this.username = username;
        this.id = id;
        this.guid = guid;
        this.token = token;
    }

    async registration(username, password) {
        const guid = common.guid();
        const token = md5(`${Date.now()}-${Math.random()}`);
        const result = await this.db.orm.insert(
            'users',
            ['username', 'password', 'token', 'guid'],
            [username, password, token, guid],
        );
        this.init({ id: result.id, username, guid, token });
        return true;
    }

    async login(username, password) {
        const data = await this.db.getUserByName(username);
        if (!data) return false;
        if (password !== data.password) return false;

        const token = md5(`${Date.now()}-${Math.random()}`);
        await this.db.updateToken(data.id, token);
        this.init({ ...data, guid: data.guid ?? String(data.id), token });
        return true;
    }

    checkToken(token) {
        return this.token === token;
    }
}

module.exports = User;
