const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const ORM = require('./ORM');

class DB {
    constructor({ DATABASE }) {
        this.db = new sqlite3.Database(`${__dirname}/${DATABASE.NAME}`);
        this.orm = new ORM(this.db);

        const sql = fs.readFileSync(`${__dirname}/data.sql`, 'utf8');
        this.db.exec(sql);
    }

    destructor() {
        this.db.close();
    }

    getUnitTypes() {
        return this.orm.all('unit_types').then(rows => {
            const types = {};
            rows.forEach(row => {
                types[row.type] = {
                    HP: row.hp,
                    SPEED: row.speed,
                    RANGE: row.range,
                    VISIBLE: row.visible,
                    DAMAGE: row.damage,
                };
            });
            return types;
        });
    }

    async getUserByName(name) {
        const row = await this.orm.get('users', { username: name });
        if (!row) return null;

        return {
            id: row.id,
            name: row.username,
            passwordHash: row.password,
            token: row.token,
            guid: row.guid,
        };
    }

    updateToken(id, token) {
        return this.orm.update('users', ['token'], [token], { id });
    }

    registration(name, guid, passwordHash) {
        return this.orm.insert(
            'users',
            ['username', 'password', 'guid'],
            [name, passwordHash, guid],
        );
    }
}

module.exports = DB;