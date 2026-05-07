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

    async getAllUnits() {
        const units = await this.orm.all('units');
        if (!units || units.length === 0) return [];

        const allProperties = await this.orm.all('units_property');

        const propsByUnitId = {};
        for (const prop of allProperties) {
            if (!propsByUnitId[prop.unit_id]) {
                propsByUnitId[prop.unit_id] = [];
            }
            propsByUnitId[prop.unit_id].push(prop);
        }
        return units.map(unit => {
            const props = propsByUnitId[unit.id] || [];
            const unitWithProps = { ...unit };
            for (const attr of props) {
                unitWithProps[attr.name] = attr.value;
            }
            return unitWithProps;
        });
    }

    async getAllBuildings() {
        const buildings = await this.orm.all('builings');
        if (!buildings || buildings.length === 0) return [];

        const allProperties = await this.orm.all('building_property');

        const propsByBuildingId = {};
        for (const prop of allProperties) {
            if (!propsByBuildingId[prop.building_id]) {
                propsByBuildingId[prop.building_id] = [];
            }
            propsByBuildingId[prop.building_id].push(prop);
        }

        return buildings.map(building => {
            const props = propsByBuildingId[building.id] || [];
            const buildingWithProps = { ...building };
            for (const attr of props) {
                buildingWithProps[attr.name] = attr.value;
            }
            return buildingWithProps;
        });
    }

    async getUserByName(name) {
        return await this.orm.get('users', { name });
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