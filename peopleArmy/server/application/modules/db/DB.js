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
                    HP:      row.hp,
                    SPEED:   row.speed,
                    RANGE:   row.range,
                    VISIBLE: row.visible,
                    DAMAGE:  row.damage,
                };
            });
            return types;
        });
    }

    getUserByName(username) {
        return this.orm.get('users', { username }).then((row) => {
            if (!row) {
                return null;
            }

            return {
                ...row,
                name: row.username,
                passwordHash: row.password,
            };
        });
    }

    updateToken(id, token) {
        return this.orm.update('users', ['token'], [token], { id });
    }

    registration(first, second, third) {
        const username = first;
        const secondIsGuid = typeof second === 'string'
            && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(second);
        const guid = secondIsGuid ? second : third;
        const password = secondIsGuid ? third : second;

        return this.orm.insert(
            'users',
            ['username', 'password', 'guid'],
            [username, password, guid],
        );
    }

}

module.exports = DB;
