const { LOBBY_MAX_SIZE } = require("../../../config");
const Player = require("./Player");

class Lobby {
    constructor({ creatorGuid, lobbyName, role = 'spectator' }) {
        this.lobbyName = lobbyName;
        this.creatorGuid = creatorGuid;
        this.maxPlayers = LOBBY_MAX_SIZE;
        this.playersGuilds = {
            spectator: null,
            peopleArmy: null,
            peopleEconomy: null,
            mushroomArmy: null,
            mushroomEconomy: null,
        }

        this.playersGuilds.spectator = new Player(creatorGuid, role);
    }

    //получить информацию о комнате 
    get() {
        return {
            lobbyName: this.lobbyName,
            creatorGuid: this.creatorGuid,
            players: Object.values(this.playersGuilds)
                .filter(player => player !== null)
                .map(player => player.get()),
        };
    }

    //добавить игрока
    addPlayer(guid, role) {
        if (guid && role && this.playersGuilds[role] === null) {
            if (guid === this.creatorGuid) {
                return false;
            }
            if (Object.values(this.playersGuilds).some(player => player?.guid === guid)) {
                return false;
            }
            this.playersGuilds[role] = new Player(guid, role);
            return true;
        }
        return false;
    }

    //удалить игрока
    removePlayer(guid) {
        const role = Object.keys(this.playersGuilds).find(key => this.playersGuilds[key]?.guid === guid);
        if (role) {
            this.playersGuilds[role] = null;
            return true;
        }
        return false;
    }


    //установить статус игрока
    setPlayerReady(guid) {
        const player = Object.values(this.playersGuilds).find(p => p?.guid === guid);
        if (player) {
            player.setReady();
            return true;
        }
        return false;
    }

    canStarted() {
        for (const player of Object.values(this.playersGuilds)) {
            if (player && !player.isReady()) {
                return false;
            }
        }
        return true;
    }

    isGuidInRoom(guid) {
        for (const player of Object.values(this.playersGuilds)) {
            if (player && player.guid === guid) {
                return true;
            }
        }
        return false;
    }


    canJoin () {
        const count = Object.values(this.playersGuilds).filter(p => p !== null).length;
        return count < this.maxPlayers;
    }
}

module.exports = Lobby;