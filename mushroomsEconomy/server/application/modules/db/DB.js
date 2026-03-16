const sqlite3 = require('sqlite3').verbose();
const ORM = require('./ORM');

// Тут используется sqlite3, но вы можете сменить её на другую (лучше так и сделать). Трусов упомянул postgreSQL, поэтому если будете менять, ставьте её

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

    async createRoom(name, ownerId) {
        const id = this.common.guid();
        const participants = JSON.stringify([ownerId]);
        
        await this.orm.insert('rooms', ['id', 'name', 'ownerId', 'participants'], [id, name, ownerId, participants]);
        
        return new Room({ id, name, ownerId, participants: [ownerId] });
    }

    async getRoomById(id) {
        const row = await this.orm.get('rooms', { id });
        if (!row) return null;
        
        return new Room({
            ...row,
            participants: JSON.parse(row.participants || '[]')
        });
    }

    async getAllRooms() {
        const rows = await this.orm.all('rooms');
        return rows.map(row => new Room({
            ...row,
            participants: JSON.parse(row.participants || '[]')
        }));
    }

    async saveRoom(room) {
        const participants = JSON.stringify(room.participants);
        const existing = await this.orm.get('rooms', { id: room.id });
        
        if (existing) {
            await this.orm.update('rooms', ['name', 'ownerId', 'participants'], [room.name, room.ownerId, participants], { id: room.id });
        } else {
            await this.orm.insert('rooms', ['id', 'name', 'ownerId', 'participants'], [room.id, room.name, room.ownerId, participants]);
        }
    }

    async deleteRoom(id) {
        await this.orm.delete('rooms', { id });
    }

    destructor() {
        this.db.close();
    }
}

module.exports = DB;