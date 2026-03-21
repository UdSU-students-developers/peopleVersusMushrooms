class Lobby {
    constructor({ creatorGuid, roomName, common, role = 'spectator' }) {
        this.guid = common.guid();
        this.name = roomName;
        this.creatorGuid = creatorGuid;
        this.creatorId = creator.id;
        this.playersGuilds = {
            spectator: null,
            peopleArmy: null,
            peopleEconomy: null,
            mushroomArmy: null,
            mushroomEconomy: null,
        }
    }

    //получить информацию о комнате 
    get() {
        return {
            guid: this.guid,
            name: this.name,
            creatorGuid: this.creatorGuid,
            playersGuilds: Object.values(this.playerGuilds).map(player => player.get()),
        };
    }

    //добавить игрока
    addPlayer(guid, role) {
        if (guid && role && this.playerGuilds[role] === null) {
            if (guid === this.creatorGuid) {
                return false;
            }
            for (let value of this.playersGuilds) {
                if (value === guid) {
                    return false;
                }
            }
            this.playerGuilds[role] = new Player(guid, role);
            return true;
        }
        return false;
    }

    //удалить игрока
    removePlayer(guid) {
        for (let key in this.playersGuilds) {
            if (this.playersGuilds[key]?.guid === guid) {
                this.playersGuilds[key] = null;
                return true;
            }
        }
        return false;
    }


    //установить статус игрока
    setPlayerReady(guid) {
        let result = false;
        Object.values(this.playersGuilds).forEach(player => {
            if (player?.guid === guid) {
                player.setReady();
                result = true;
            }
        });
        return result;
    }

    canStarted() {
        return (this.playersGuilds.spectator === null || this.playersGuilds.spectator.isReady()) ||
        (this.playersGuilds.peopleArmy === null || this.playersGuilds.peopleArmy.isReady()) ||
        (this.playersGuilds.peopleEconomy === null || this.playersGuilds.peopleEconomy.isReady()) ||
        (this.playersGuilds.mushroomArmy === null || this.playersGuilds.mushroomArmy.isReady()) ||
        (this.playersGuilds.mushroomEconomy === null || this.playersGuilds.mushroomEconomy.isReady());
    }

    isGuidInRoom(guid) {
        return Object.values(this.playersGuilds).findIndex(player => player?.guid === guid) > -1;
    }
}

module.exports = Lobby;