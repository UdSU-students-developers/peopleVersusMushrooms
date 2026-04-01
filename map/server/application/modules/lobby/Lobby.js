const { LOBBY_MAX_SIZE } = require("../../../config");
const Player = require("./Player");

class Lobby {
    constructor({ creatorGuid, lobbyName, role = 'spectator' }) {
        this.lobbyName = lobbyName;
        this.creatorGuid = creatorGuid;
        this.maxPlayers = LOBBY_MAX_SIZE;
        this.playersGuids = {
            spectator: null,
            peopleArmy: null,
            peopleEconomy: null,
            mushroomArmy: null,
            mushroomEconomy: null,
        }

        this.playersGuids.spectator = new Player(creatorGuid, role);
    }

    //получить информацию о комнате 
    get() {
        return {
            lobbyName: this.lobbyName,
            creatorGuid: this.creatorGuid,
            players: Object.values(this.playersGuids)
                .filter(player => player !== null)
                .map(player => player.get()),
        };
    }

    getGuids() {
        return {
            ...this.playersGuids
        }
    }

    //добавить игрока
    addPlayer(guid, role) {
        if (guid && role && this.playersGuids[role] === null) {
            if (guid === this.creatorGuid) {
                return false;
            }
            if (Object.values(this.playersGuids).some(player => player?.guid === guid)) {
                return false;
            }
            this.playersGuids[role] = new Player(guid, role);
            return true;
        }
        return false;
    }

    //удалить игрока
    removePlayer(guid) {
        const role = Object.keys(this.playersGuids).find(key => this.playersGuids[key]?.guid === guid);
        if (role) {
            this.playersGuids[role] = null;
            return true;
        }
        return false;
    }


    //установить статус игрока
    setPlayerReady(guid) {
        const player = Object.values(this.playersGuids).find(p => p?.guid === guid);
        if (player) {
            player.setReady();
            return true;
        }
        return false;
    }

    canStarted() {
        for (const player of Object.values(this.playersGuids)) {
            if (player && !player.isReady()) {
                return false;
            }
        }
        return true;
    }

    isGuidInLobby(guid) {
        for (const player of Object.values(this.playersGuids)) {
            if (player && player.guid === guid) {
                return true;
            }
        }
        return false;
    }


    canJoin () {
        const count = Object.values(this.playersGuids).filter(p => p !== null).length;
        return count < this.maxPlayers;
    }
}

module.exports = Lobby;