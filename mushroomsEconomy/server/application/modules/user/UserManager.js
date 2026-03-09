const crypto = require('node:crypto');
const BaseManager = require('../BaseManager');

class UserManager extends BaseManager {
    constructor(options) {
        super(options);
        this.answer = options.answer;
    }

    hashPassword(password) {
        return crypto('sha256').update(password).digest('hex');
    }

    generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    async registration(login, password, username) {
        if (await this.db.getUserByLogin(login)) {
            return this.answer.bad(100);
        }

        const passwordHash = this.hashPassword(password);
        console.log(passwordHash);
        const token = this.generateToken();
        const user = await this.db.registration(login, passwordHash, username, token);

        return this.answer.good(user);
    }

    async login(login, password) {
        const user = await this.db.getUserByLogin(login);
        if (!user) {
            return this.answer.bad(100);
        }

        const passwordHash = this.hashPassword(password);
        console.log(passwordHash);

        if (user.password === passwordHash) {
            const token = this.generateToken();
            await this.db.updateToken(user.id, token);

            return this.answer.good(true);
        }

        this.answer.bad(11);
    }

    async logout(token) {
        const user = await this.db.getUserByToken(token);
        if (user) {
            await this.db.updateToken(user.id, null);
            return this.answer.good(true);
        }

        return this.answer.bad(100);
    }
}

module.exports = UserManager;