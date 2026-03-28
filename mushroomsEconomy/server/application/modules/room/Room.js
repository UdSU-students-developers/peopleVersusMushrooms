class Room {
    constructor({ creatorGuid, roomName, common }) {
        this.guid = common.guid();
        this.name = roomName;
        this.creatorGuid = creatorGuid;
        
        this.players = new Set([creatorGuid]); 
    }

    get() {
        return {
            id: this.guid,
            name: this.name,
            creatorGuid: this.creatorGuid,
            status: this.status,
            participants: Array.from(this.players) 
        };
    }

    addPlayer(guid) {
        if (!guid) return false;
        
        if (this.players.has(guid)) return false;

        this.players.add(guid);
        
        return true;
    }

    removePlayer(guid) {
        if (this.players.has(guid)) {
            this.players.delete(guid);
            return true;
        }
        return false;
    }

    isGuidInRoom(guid) {
        return this.players.has(guid);
    }

}

module.exports = Room;
