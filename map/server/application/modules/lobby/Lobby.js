class Lobby {
    constructor({ creator, roomName, maxPlayers, common }) {
        this.common = common;
        this.guid = common.guidRoom();
        this.name = roomName;
        this.creator = creator.guid;
        this.creatorId = creator.id;
        this.maxPlayers = maxPlayers;
        this.players = [creator]; // массив объектов User
        this.playersMap = new Map(); // user.guid -> { user, status }
        this.playersMap.set(creator.guid, { user: creator, status: 'ready' });
        
        this.status = maxPlayers === 1 ? 'closed' : 'open';
        this.gameState = 'waiting';
    }

    //получить информацию о комнате 
    get() {
        return {
            guid: this.guid,
            name: this.name,
            creator: this.creator,
            status: this.status,
            gameState: this.gameState,
            playersCount: this.players.length,
            maxPlayers: this.maxPlayers,
            players: Array.from(this.playersMap.values()).map(p => ({
                guid: p.user.guid,
                nickname: p.user.nickname,
                status: p.status
            })),
        };
    }

    //получить детальную информацию (для тех, кто в комнате) - ???
    getSelf() {
        return {
            guid: this.guid,
            name: this.name,
            creator: this.creator,
            status: this.status,
            gameState: this.gameState,
            playersCount: this.players.length,
            maxPlayers: this.maxPlayers,
            players: Array.from(this.playersMap.values()).map(p => ({
                guid: p.user.guid,
                nickname: p.user.nickname,
                token: p.user.token,
                status: p.status
            })),
        };
    }

    //добавить игрока
    addPlayer(user) {
        this.players.push(user);
        this.playersMap.set(user.guid, { user, status: 'ready' });
    }

    //удалить игрока
    removePlayer(userGuid) {
        this.players = this.players.filter(p => p.guid !== userGuid);
        this.playersMap.delete(userGuid);
    }

    //установить создателя
    setCreator(userGuid) {
        this.creator = userGuid;
    }

    //установить статус комнаты (open/closed)
    setStatus(status) {
        this.status = status;
    }

    //установить состояние игры (waiting/playing/finished?)
    setGameState(state) {
        this.gameState = state;
    }

    //установить статус игрока (ready/started)
    setPlayerStatus(userGuid, status) {
        const player = this.playersMap.get(userGuid);
        if (player) {
            player.status = status;
        }
    }

    //получить статус игрока
    getPlayerStatus(userGuid) {
        const player = this.playersMap.get(userGuid);
        return player ? player.status : null;
    }
}

module.exports = Lobby;