const sqlite3 = require('sqlite3').verbose();
const ORM = require('./ORM');

// Тут используется sqlite3, но вы можете сменить её на другую (лучше так и сделать). Трусов упомянал postgreSQL, поэтому если будете менять, ставьте её

class DB {
    constructor({ DATABASE }) {
        this.db = new sqlite3.Database(`${__dirname}/${DATABASE.NAME}`);
        this.orm = new ORM(this.db);
    }

    async getUserByName(name) {
        return await this.orm.get('users', { name });
    }

    async getUserByToken(token) {
        return await this.orm.get('users', { token });
    }

    async registration(name, guid, passwordHash, token) {
        return await this.orm.insert('users', ['name', 'guid', 'password_hash', 'token'], [name, guid, passwordHash, token]);
    }

    async updateToken(id, token) {
        return await this.orm.update('users', ['token'], [token], { id });
    }

    destructor() {
        this.db.close();
    }
}

module.exports = DB;