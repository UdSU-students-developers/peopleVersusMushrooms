const CONFIG = require('../../../config');
const BaseManager = require('../BaseManager');
const Lobby = require('./Lobby');

const { SOCKET } = CONFIG;

class LobbyManager extends BaseManager {
    constructor(options) {
        super(options);

        this.users = {};
        this.lobbies = {};
        this.userToLobby = {};

        this.init();
    }

    init() {
        this.handleConnection(this.io);
    }

    handleConnection(io) {
        io.on('connection', (socket) => {
            console.log(`LobbyManager: Client connected: ${socket.id}`);

            socket.on(SOCKET.CREATE_LOBBY, (data) => this.socketCreateLobby(socket, data));
            socket.on(SOCKET.JOIN_LOBBY,   (data) => this.socketJoinLobby(socket, data));
            socket.on(SOCKET.LEAVE_LOBBY,  (data) => this.socketLeaveLobby(socket, data));
            socket.on(SOCKET.KICK_FROM_LOBBY, (data) => this.socketKickFromLobby(socket, data));
            socket.on(SOCKET.GET_LOBBIES,  (data) => this.socketGetLobbies(socket, data));

            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
    }

    getUser(socket) {
        return this.users[socket.id];
    }

    socketCreateLobby(socket, data) {
        const user = this.getUser(socket);
        if (!user) return this.answer.bad(17);
        if (!data?.name) return this.answer.bad(18);

        if (this.userToLobby[user.id]) {
            this._leaveLobby(user.id, socket);
        }

        const lobby = new Lobby({
            creatorGuid: user.id,
            roomName: data.name,
            common: this.common
        });

        this.lobbies[lobby.guid] = lobby;
        this.userToLobby[user.id] = lobby.guid;

        socket.join(lobby.guid);
        socket.emit(SOCKET.LOBBY_CREATED, lobby.get());
        this._notifyLobbiesUpdated();
    }

    socketJoinLobby(socket, data) {
        const user = this.getUser(socket);
        if (!user) return this.answer.bad(17);

        const lobby = this.lobbies[data?.lobbyId];
        if (!lobby) return this.answer.bad(19);
        if (lobby.isGuidInRoom(user.id)) return;

        if (this.userToLobby[user.id]) {
            this._leaveLobby(user.id, socket);
        }

        if (lobby.addPlayer(user.id)) {
            this.userToLobby[user.id] = lobby.guid;
            socket.join(lobby.guid);
            this._notifyLobbyUpdate(lobby.guid);
            this._notifyLobbiesUpdated();
        }
    }

    socketLeaveLobby(socket, data) {
        const user = this.getUser(socket);
        if (!user) return this.answer.bad(17);

        this._leaveLobby(user.id, socket);
        socket.emit(SOCKET.LOBBY_UPDATED, { status: 'left' });
    }

    socketKickFromLobby(socket, data) {
        const admin = this.getUser(socket);
        if (!admin) return this.answer.bad(17);

        const lobby = this.lobbies[data?.lobbyId];
        if (!lobby) return this.answer.bad(19);
        if (lobby.creatorGuid !== admin.id) return this.answer.bad(20);

        if (lobby.removePlayer(data.targetGuid)) {
            delete this.userToLobby[data.targetGuid];
            this._notifyLobbyUpdate(lobby.guid);
        }
    }

    socketGetLobbies(socket, data) {
        socket.emit(SOCKET.LOBBIES_LIST, this._getLobbies());
    }

    handleDisconnect(socket) {
        const user = this.getUser(socket);
        if (user) {
            this._leaveLobby(user.id, socket);
            delete this.users[socket.id];
        }
    }

    _leaveLobby(userGuid, socket) {
        const lobbyGuid = this.userToLobby[userGuid];
        if (!lobbyGuid) return;

        const lobby = this.lobbies[lobbyGuid];
        if (!lobby) {
            delete this.userToLobby[userGuid];
            return;
        }

        lobby.removePlayer(userGuid);
        delete this.userToLobby[userGuid];

        if (socket) socket.leave(lobbyGuid);

        if (userGuid === lobby.creatorGuid || lobby.players.size === 0) {
            this._destroyLobby(lobby);
        } else {
            this._notifyLobbyUpdate(lobbyGuid);
        }
    }

    _destroyLobby(lobby) {
        delete this.lobbies[lobby.guid];
        this._notifyLobbiesUpdated();
    }

    _getLobbies() {
        return Object.values(this.lobbies).map(l => l.get());
    }

    _notifyLobbyUpdate(lobbyGuid) {
        const lobby = this.lobbies[lobbyGuid];
        if (!lobby) return;
        this.io.to(lobbyGuid).emit(SOCKET.LOBBY_UPDATED, lobby.get());
    }

    _notifyLobbiesUpdated() {
        this.io.emit(SOCKET.LOBBIES_LIST_UPDATED, this._getLobbies());
    }
}

module.exports = LobbyManager;