const sqlite3 = require('sqlite3').verbose();
const ORM = require('./ORM');


class DB {
    constructor({ DATABASE }) {
        this.db = new sqlite3.Database(`${__dirname}/${DATABASE.NAME}`);
        this.orm = new ORM(this.db);
    }

    destructor() {
        this.db.close();
    }

    getUserByName(username) {
        return this.orm.get('users', { username });
    }

    updateToken(id, token) {
        return this.orm.update('users', ['token'], [token], { id });
    }

    registration(username, password, guid) {
        this.orm.insert(
            'users',
            ['username', 'password', 'guid'],
            [username, password, guid],
        );
    }

}

module.exports = DB;