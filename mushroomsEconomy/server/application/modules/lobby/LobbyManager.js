const CONFIG = require('../../../config');
const BaseManager = require('../BaseManager');
const Lobby = require('./Lobby');

class LobbyManager extends BaseManager {
    constructor(options) {
        super(options);

        this.users = {};
        this.lobbies = {}; 
        this.userToRoom = {}; 

        this.init();
    }

    init() {
        this.handleConnection(this.io);
    }

    handleConnection(io) {
        io.on('connection', (socket) => {
            console.log(`LobbyManager: Client connected: ${socket.id}`);

            socket.on(CONFIG.SOCKET.CREATE_ROOM, (data) => this.handleCreateRoom(socket, data));
            socket.on(CONFIG.SOCKET.JOIN_ROOM, (data) => this.handleJoinRoom(socket, data));
            socket.on(CONFIG.SOCKET.LEAVE_ROOM, (data) => this.handleLeaveRoom(socket, data));
            socket.on(CONFIG.SOCKET.DROP_FROM_ROOM, (data) => this.handleKickUser(socket, data));
            socket.on(CONFIG.SOCKET.GET_ROOMS, (data) => this.handleGetRooms(socket, data));
            
            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
    }
    
    sendError(socket, code) {
        const message = this.answer.bad(code);
        socket.emit(CONFIG.SOCKET.ERROR, { code, message });
    }

    getUser(socket) { 
        return this.users[socket.id];
    }

    handleCreateRoom(socket, data) {
        const user = this.getUser(socket);
        if (!user) return this.sendError(socket, 17);
        if (!data || !data.name) return this.sendError(socket, 18);

        if (this.userToRoom[user.id]) {
            this._leaveRoom(user.id, socket);
        }

        const lobby = new Lobby({ 
            creatorGuid: user.id, 
            roomName: data.name, 
            common: this.common 
        });

        this.lobbies[lobby.guid] = lobby;
        this.userToRoom[user.id] = lobby.guid;

        socket.join(lobby.guid);

        socket.emit('room_created', lobby.get());
        this._notifyRoomsListUpdated();
    }

    handleJoinRoom(socket, data) {
        const user = this.getUser(socket);
        if (!user) return this.sendError(socket, 17);
        
        const { roomId } = data;
        const lobby = this.lobbies[roomId];
        
        if (!lobby) return this.sendError(socket, 19);

        if (lobby.isGuidInRoom(user.id)) return;

        if (this.userToRoom[user.id]) {
            this._leaveRoom(user.id, socket);
        }

        if (lobby.addPlayer(user.id)) {
            this.userToRoom[user.id] = lobby.guid;
            
            socket.join(lobby.guid);

            this._notifyRoomUpdate(lobby.guid);
            this._notifyRoomsListUpdated();
        }
    }

    handleLeaveRoom(socket, data) {
        const user = this.getUser(socket);
        if (!user) return this.sendError(socket, 17);

        this._leaveRoom(user.id);
        socket.emit('room_updated', { status: 'left' });
    }

    handleKickUser(socket, data) {
        const admin = this.getUser(socket);
        if (!admin) return this.sendError(socket, 17);

        const { targetGuid, roomId, userID } = data;
        const lobby = this.lobbies[roomId];

        if (!lobby) return this.sendError(socket, 19);
        if (lobby.creatorGuid !== admin.id) return this.sendError(socket, 20);

        if (lobby.removePlayer(targetGuid)) {
            delete this.userToRoom[targetGuid];
            this._notifyRoomUpdate(lobby.guid);
        }
    }

    handleGetRooms(socket, data) {
        const rooms = this._getPublicRooms();
        socket.emit('rooms_list', rooms);
    }

    handleDisconnect(socket) {
        const user = this.getUser(socket);
        if (user) {
            this._leaveRoom(user.id, socket);
            delete this.users[socket.id];
        }
    }

    _leaveRoom(userGuid, socket) {
        const roomGuid = this.userToRoom[userGuid];
        if (!roomGuid) return;

        const lobby = this.lobbies[roomGuid];
        if (!lobby) {
            delete this.userToRoom[userGuid];
            return;
        }

        lobby.removePlayer(userGuid);
        delete this.userToRoom[userGuid];

        if (socket) {
            socket.leave(roomGuid);
        }

        if (userGuid === lobby.creatorGuid || lobby.players.size === 0) {
            this._destroyLobby(lobby);
        } else {
            this._notifyRoomUpdate(roomGuid);
        }
    }

    _destroyLobby(lobby) {
        delete this.lobbies[lobby.guid];
        this._notifyRoomsListUpdated();
    }

    _getPublicRooms() {
        return Object.values(this.lobbies).map(l => l.get());
    }

    _notifyRoomUpdate(roomGuid) {
        const lobby = this.lobbies[roomGuid];
        if (!lobby) return;

        const data = lobby.get();
        
        this.io.to(roomGuid).emit('room_updated', data);
    }

    _notifyRoomsListUpdated() {
        const rooms = this._getPublicRooms();
        this.io.emit('rooms_list_updated', rooms);
    }
}

module.exports = LobbyManager;