const sqlite3 = require('sqlite3').verbose();
const ORM = require('./ORM');


class DB {
    constructor({ DATABASE }) {
        this.db = new sqlite3.Database(`${__dirname}/${DATABASE.NAME}`);
        this.orm = new ORM(this.db);
    }

    getUserByLogin(username) {
        return this.orm.get('users', { username });
    }

    getUserByGuid(guid) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM users WHERE guid = ?';
            this.db.get(query, [guid], (err, row) => {
                if (err) {
                    console.error('Ошибка при поиске пользователя по GUID:', err);
                    reject(err);
                }
                resolve(row);
            });
        });
    }

    updateToken(id, token) {
        return this.orm.update('users', ['token'], [token], { id });
    }

    async addUser(username, password, guid) {

        const sql = "INSERT INTO users (username, password, guid) VALUES (?, ?, ?)";
        return new Promise(resolve => {
            this.db.run(sql, [username, password, guid], (err) => {
                if (err) {
                    console.error('Ошибка при добавлении пользователя:', err.message);
                    return resolve(false);
                }
                resolve(true);
            });
        });
    }


    updateGuid(id, guid) {
        return this.orm.update('users', ['guid'], [guid], { id });
    }


    updateGuidByGuid(oldGuid, newGuid) {
        return this.orm.update('users', ['guid'], [newGuid], { guid: oldGuid });
    }

    destructor() {
        this.db.close();
    }
}

module.exports = DB;