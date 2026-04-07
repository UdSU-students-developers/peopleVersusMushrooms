const { LOBBY_MAX_SIZE } = require("../../../config");
const Player = require("./Player");

class Lobby {
    constructor({ lobbyGuid, lobbyName, role = 'spectator' }) {
        this.lobbyName = lobbyName;
        this.lobbyGuid = lobbyGuid;
        this.maxPlayers = LOBBY_MAX_SIZE;
        this.playersGuids = {
            spectator: null,
            peopleArmy: null,
            peopleEconomy: null,
            mushroomArmy: null,
            mushroomEconomy: null,
        }

        this.playersIsReady = {
            spectator: false,
            peopleArmy: false,
            peopleEconomy: false,
            mushroomArmy: false,
            mushroomEconomy: false
        }

        this.playersGuids[role] = lobbyGuid;
    }

    //получить информацию о комнате 
    get() {
        return {
            lobbyName: this.lobbyName,
            lobbyGuid: this.lobbyGuid,
            playersGuids: {...this.playersGuids },
            playersIsReady: { ...this.playersIsReady }
        };
    }

    getGuids() {
        return { ...this.playersGuids }
    }

    //добавить игрока
    addPlayer(guid, role) {
        if (guid && role && this.playersGuids[role] === null) {
            if (guid === this.lobbyGuid) {
                return false;
            }
            if (Object.values(this.playersGuids).some(someGuid => someGuid === guid)) {
                return false;
            }
            this.playersGuids[role] = guid;
            return true;
        }
        return false;
    }

    //удалить игрока
    removePlayer(guid) {
        const role = Object.keys(this.playersGuids).find(key => this.playersGuids[key] === guid);
        if (role) {
            this.playersGuids[role] = null;
            this.playersIsReady[role] = false;
            return true;
        }
        return false;
    }


    //установить статус игрока
    setPlayerReady(guid) {
        const role = Object.key(this.playersGuids).find(role => this.playersGuids[role] === guid);
        if (role) {
            this.playersIsReady[role] = true;
            return true;
        }
        return false;
    }

    canStarted() {
        for (const isReady of Object.values(this.playersIsReady)) {
            if (!isReady) {
                return false;
            }
        }
        return true;
    }

    isGuidInLobby(guid) {
        for (const playerGuid of Object.values(this.playersGuids)) {
            if (playerGuid && playerGuid === guid) {
                return true;
            }
        }
        return false;
    }


    canJoin() {
        const count = Object.values(this.playersGuids).filter(g => g !== null).length;
        return count < this.maxPlayers;
    }
}

module.exports = Lobby;