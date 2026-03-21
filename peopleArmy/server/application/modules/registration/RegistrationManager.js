const md5 = require('md5');
const BaseManager = require('../BaseManager');

class RegistrationManager extends BaseManager {
    constructor(mediator, db) {
        super(mediator, db);

        // Регистрируем триггер: любой модуль может вызвать mediator.get(REGISTER, { username, password })
        // и получить результат регистрации без прямой ссылки на RegistrationManager
        this.mediator.set(this.TRIGGERS.REGISTER, (data) => this.register(data?.username, data?.password));
    }

    /**
     * Регистрирует пользователя: сохраняет в БД (с токеном) и возвращает username, password и token.
     * @param {string} username
     * @param {string} password
     * @returns {Promise<{username: string, password: string, token: string} | null>} — данные зарегистрированного пользователя или null, если такой username уже есть.
     */
    async register(username, password) {
        const existing = await this.db.orm.get('users', { username }, 'id');
        if (existing) {
            return null;
        }
        const token = md5(`${Date.now()}-${Math.random()}`);
        await this.db.orm.insert('users', ['username', 'password', 'token'], [username, password, token]);
        const user = { username, password, token };
        // Уведомляем подписчиков: кто-то зарегистрировался
        this.mediator.call(this.EVENTS.USER_REGISTERED, user);
        return user;
    }

}

module.exports = RegistrationManager;
