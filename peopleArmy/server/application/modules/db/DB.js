const sqlite3 = require('sqlite3').verbose();
const ORM = require('./ORM');


class DB {
    constructor({ DATABASE }) {
        this.db = new sqlite3.Database(`${__dirname}/${DATABASE.NAME}`);
        this.orm = new ORM(this.db);
    }

    getUserByName(username) {
        return this.orm.get('users', { username });
    }

    updateToken(id, token) {
        return this.orm.update('users', ['token'], [token], { id });
    }

    getUnitTypes() {
        return this.orm.all('unit_types', null);
    }

    destructor() {
        this.db.close();
    }
}

module.exports = DB;