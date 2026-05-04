const sqlite3 = require('sqlite3').verbose();
const ORM = require('./ORM');


class DB {
    constructor({ DATABASE }) {
        this.db = new sqlite3.Database(`${__dirname}/${DATABASE}`);
        this.orm = new ORM(this.db);
        this.initTables();
    }

    initTables() {
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                guid TEXT UNIQUE NOT NULL,
                passwordHash TEXT NOT NULL,
                token TEXT UNIQUE
            )
        `;
        this.db.run(createUsersTable, (err) => {
            if (err) console.error('[DB] Error creating users table:', err);
        });
    }

    async getUserByName(name) {
        return await this.orm.get('users', { name });
    }

    async getUnitByType(type) {
        const unit = await this.orm.get('units', { type });

        if (!unit) return null;

        const property = await this.orm.all('units_property', { unit_id: unit.id });
        const result = { ...unit };
        for (const attr of property) {
            result[attr.name] = attr.value; // result["hp"] = 100
        }

        return result;
    }

    async getBuildingByType(type) {
        const building = await this.orm.get('builings', { type });

        if (!building) return null;

        const property = await this.orm.all('building_property', { building_id: building.id });
        const result = { ...building };
        for (const attr of property) {
            result[attr.name] = attr.value; // result["hp"] = 100
        }

        return result;
    }

    async getUserByToken(token) {
        return await this.orm.get('users', { token });
    }

    async registration(name, guid, passwordHash) {
        return await this.orm.insert('users', ['name', 'guid', 'passwordHash'], [name, guid, passwordHash]);
    }

    async updateToken(id, token) {
        return await this.orm.update('users', ['token'], [token], { id });
    }

    destructor() {
        this.db.close();
    }
}

module.exports = DB;