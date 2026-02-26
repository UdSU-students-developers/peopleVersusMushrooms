const md5 = require('md5');

class Example { //В данном случае под классом Example подразумевается активная запись
    constructor(db) {
        this.db = db;

        this.username;
        this.id;
        this.token;
    }

    get () {
        return {
            username: this.username,
            id: this.id,
        }
    }

    getSelf() {
        return {
            ...this.get(),
            token: this.token,
        }
    }

    init({ id, username, token }) {
        this.username = username;
        this.id = id;
        this.token = token;
    }

    async login(username, password) {
        const data = await this.db.getUserByName(username);
        if (!data) {
            return false;
        }
        if (password !== data.password) {
            return false
        }

        const token = md5(`${Math.round(Math.random() * 1000000)}`);
        this.db.updateToken(data.id, token);
        this.init({ ...data, token });
        return true;
    }

    checkToken(token) {
        return this.token === token;
    }
}

module.exports = Example;