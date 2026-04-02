class Lobby {
    constructor({ creatorGuid, common, socket }) {
        this.guid = common.guid();
        this.creatorGuid = creatorGuid;
        this.socketId = socket.id;
        this.players = new Set([creatorGuid]); 
    }

    destructor() {
        
    }

    get() {
        return {
            guid: this.guid,
            players: this.players,
        }
    }

    getSelf() {
        return {
            ...this.get(),
            socketId: this.socketId,
        }
    }

    addPlayer(guid) {
        this.players.add(guid);
    }

    removePlayer(guid) {
        this.players.delete(guid);
    }



}

module.exports = Lobby;
