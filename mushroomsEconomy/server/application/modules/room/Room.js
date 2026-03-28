class Room {
    constructor(creatorGuid, roomName, common) {
        this.guid = common.guid();
        this.roomName = roomName;
        this.creatorGuid = creatorGuid;
        
        this.participants = new Set(); 
    }

    get() {
        return {
            guid: this.guid,
            name: this.name,
            creatorGuid: this.creatorGuid,
            participants: this.participants,
        };
    }

    addPlayer(guid) {
        if (!guid) return; 
        this.participants.add(guid);
        return true;
    }

    removePlayer(guid) {
        if (!this.participants.has(guid)) return;
        participants.delete(guid);
        return true;
    }

    isGuidInRoom(guid) {
        return this.participants.has(guid);
    }

}

module.exports = Room;
