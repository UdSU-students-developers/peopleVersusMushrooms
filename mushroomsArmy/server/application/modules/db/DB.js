const sqlite3 = require('sqlite3').verbose();
const ORM = require('./ORM');

// Тут используется sqlite3, но вы можете сменить её на другую (лучше так и сделать). Трусов упомянул postgreSQL, поэтому если будете менять, ставьте её

class DB {
    constructor({ DATABASE }) {
        this.db = new sqlite3.Database(`${__dirname}/${DATABASE.NAME}`);
        this.orm = new ORM(this.db);
        this.initTables();
    }

    initTables() {
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                guid TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                token TEXT UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        return new Promise((resolve) => {
            this.db.run(createUsersTable, function(err) {
                if (err) {
                    console.error('Error creating users table:', err);
                } else {
                    console.log('Users table initialized');
                }
                resolve();
            });
        });
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