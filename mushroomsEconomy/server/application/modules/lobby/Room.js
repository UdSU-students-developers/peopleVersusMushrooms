class Room {
    constructor(orm, common) {
        this.orm = orm;
        this.common = common;
        
        this.id = null;
        this.name = null;
        this.ownerId = null;
        this.participants = [];
    }

    fillFromRow(row) {
        this.id = row.id;
        this.name = row.name;
        this.ownerId = row.ownerId;
        try {
            this.participants = JSON.parse(row.participants || '[]');
        } catch (e) {
            this.participants = [];
        }
        return this;
    }

    static async create(name, ownerId, orm, common) {
        const room = new Room(orm, common);
        room.id = common.guid();
        room.name = name;
        room.ownerId = ownerId;
        room.participants = [ownerId];

        await room.save();
        return room;
    }

    static async findById(id, orm, common) {
        const row = await orm.get('rooms', { id });
        if (!row) return null;
        
        const room = new Room(orm, common);
        return room.fillFromRow(row);
    }

    static async findAll(orm, common) {
        const rows = await orm.all('rooms');
        return rows.map(row => {
            const room = new Room(orm, common);
            return room.fillFromRow(row);
        });
    }

    async save() {
        const participantsStr = JSON.stringify(this.participants);
        const existing = await this.orm.get('rooms', { id: this.id });
        
        if (existing) {
            await this.orm.update(
                'rooms',
                ['name', 'ownerId', 'participants'],
                [this.name, this.ownerId, participantsStr],
                { id: this.id }
            );
        } else {
            await this.orm.insert(
                'rooms',
                ['id', 'name', 'ownerId', 'participants'],
                [this.id, this.name, this.ownerId, participantsStr]
            );
        }
    }

    async delete() {
        await this.orm.delete('rooms', { id: this.id });
    }

    async addParticipant(userId) {
        if (!this.participants.includes(userId)) {
            this.participants.push(userId);
            await this.save();
        }
    }

    async removeParticipant(userId) {
        this.participants = this.participants.filter(id => id !== userId);
        await this.save();
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            ownerId: this.ownerId,
            participants: this.participants
        };
    }
}

module.exports = Room;
