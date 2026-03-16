class Room {
    constructor({ id, name, ownerId, participants = [] }) {
        this.id = id;
        this.name = name;
        this.ownerId = ownerId;
        this.participants = participants;
    }
}

module.exports = Room;
