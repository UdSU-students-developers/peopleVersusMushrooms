const CONFIG = require('../../../config');
const BaseManager = require('../BaseManager');
const Room = require('./Room');

class RoomManager extends BaseManager {
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
            console.log(`RoomManager: Client connected: ${socket.id}`);

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

        const room = new Room({ 
            creatorGuid: user.id,
            roomName: data.name,
            common: this.common
        });

        this.lobbies[room.guid] = room;
        this.userToRoom[user.id] = room.guid;

        socket.join(room.guid);

        socket.emit('room_created', room.get());
        this._notifyRoomsListUpdated();
    }

    handleJoinRoom(socket, data) {
        const user = this.getUser(socket);
        if (!user) return this.sendError(socket, 17);

        const { roomId } = data;
        const room = this.lobbies[roomId];

        if (!room) return this.sendError(socket, 19);

        if (room.isGuidInRoom(user.id)) return;

        if (this.userToRoom[user.id]) {
            this._leaveRoom(user.id, socket);
        }

        if (room.addPlayer(user.id)) {
            this.userToRoom[user.id] = room.guid;

            socket.join(room.guid);

            this._notifyRoomUpdate(room.guid);
            this._notifyRoomsListUpdated();
        }
    }

    handleLeaveRoom(socket, data) {
        const user = this.getUser(socket);
        if (!user) return this.sendError(socket, 17);

        this._leaveRoom(user.id, socket); 
        socket.emit('room_updated', { status: 'left' });
    }

    handleKickUser(socket, data) {
        const admin = this.getUser(socket);
        if (!admin) return this.sendError(socket, 17);

        const { targetGuid, roomId } = data;
        const room = this.lobbies[roomId];

        if (!room) return this.sendError(socket, 19);
        if (room.creatorGuid !== admin.id) return this.sendError(socket, 20);

        if (room.removePlayer(targetGuid)) {
            delete this.userToRoom[targetGuid];
            this._notifyRoomUpdate(room.guid);
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

        const room = this.lobbies[roomGuid];
        if (!room) {
            delete this.userToRoom[userGuid];
            return;
        }

        room.removePlayer(userGuid);
        delete this.userToRoom[userGuid];

        if (socket) {
            socket.leave(roomGuid);
        }

        if (userGuid === room.creatorGuid || room.players.size === 0) {
            this._destroyRoom(room); 
        } else {
            this._notifyRoomUpdate(roomGuid);
        }
    }

    _destroyRoom(room) { 
        delete this.lobbies[room.guid];
        this._notifyRoomsListUpdated();
    }

    _getPublicRooms() {
        return Object.values(this.lobbies).map(l => l.get());
    }

    _notifyRoomUpdate(roomGuid) {
        const room = this.lobbies[roomGuid];
        if (!room) return;

        const data = room.get();

        this.io.to(roomGuid).emit('room_updated', data);
    }

    _notifyRoomsListUpdated() {
        const rooms = this._getPublicRooms();
        this.io.emit('rooms_list_updated', rooms);
    }
}

module.exports = RoomManager;