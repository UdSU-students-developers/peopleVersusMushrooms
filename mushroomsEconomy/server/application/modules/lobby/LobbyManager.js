const Room = require('./Room');
const CONFIG = require('../../../config')

class LobbyManager {
    constructor({ mediator, common, db, answer }) {
        this.mediator = mediator;
        this.common = common;
        this.db = db;
        this.orm = db.orm;
        this.answer = answer; 

        this.users = new Map(); 

        this.init();
    }

    async init() {
        this.initSocket();
    }

    initSocket() {
    }

    handleConnection(io) {
        io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);

            socket.on(CONFIG.SOCKET.LOGIN, (data) => this.handleLogin(socket, data));
            socket.on(CONFIG.SOCKET.CREATE_ROOM, (data) => this.handleCreateRoom(socket, data));
            socket.on(CONFIG.SOCKET.DELETE_ROOM, (data) => this.handleDeleteRoom(socket, data));
            socket.on(CONFIG.SOCKET.JOIN_ROOM, (data) => this.handleJoinRoom(socket, data));
            socket.on(CONFIG.SOCKET.KICK_USER, (data) => this.handleKickUser(socket, data));
            
            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
    }

    sendError(socket, code) {
        const message = this.answer.bad(code);
        socket.emit(CONFIG.SOCKET.ERROR, { code, message });
    }

    getUser(socket) { return this.users.get(socket.id); }

    async handleLogin(socket, data) {
        if (!data || !data.name) return this.sendError(socket, 16);
        
        const user = { id: this.common.guid(), name: data.name };
        this.users.set(socket.id, user);

        const rooms = await Room.findAll(this.orm, this.common);
        
        socket.emit('login_success', { 
            user, 
            rooms: rooms.map(r => r.toJSON()) 
        });
    }

    async handleCreateRoom(socket, data) {
        const user = this.getUser(socket);
        if (!user) return this.sendError(socket, 17);

        if (!data || !data.name) return this.sendError(socket, 18);

        const room = await Room.create(data.name, user.id, this.orm, this.common);
        
        socket.emit('room_created', room.toJSON());
        socket.broadcast.emit('room_created', room.toJSON());
    }

    async handleDeleteRoom(socket, data) {
        const user = this.getUser(socket);
        if (!user) return this.sendError(socket, 17);

        const room = await Room.findById(data.roomId, this.orm, this.common);
        if (!room) return this.sendError(socket, 19);

        if (room.ownerId !== user.id) return this.sendError(socket, 20);

        await room.delete();

        socket.broadcast.emit('room_deleted', { roomId: room.id });
        socket.emit('room_deleted', { roomId: room.id });
    }

    async handleJoinRoom(socket, data) {
        const user = this.getUser(socket);
        if (!user) return this.sendError(socket, 17);

        const room = await Room.findById(data.roomId, this.orm, this.common);
        if (!room) return this.sendError(socket, 19);

        await room.addParticipant(user.id);

        socket.emit('room_updated', room.toJSON());
        socket.broadcast.emit('room_updated', room.toJSON());
    }

    async handleKickUser(socket, data) {
        const user = this.getUser(socket);
        if (!user) return this.sendError(socket, 17);

        const room = await Room.findById(data.roomId, this.orm, this.common);
        if (!room) return this.sendError(socket, 19);

        if (room.ownerId !== user.id) return this.sendError(socket, 20);

        await room.removeParticipant(data.userId);

        socket.emit('Комната обновлена', room.toJSON());
        socket.broadcast.emit('Комната обновлена', room.toJSON());
    }

    handleDisconnect(socket) {
        this.users.delete(socket.id);
    }
}

module.exports = LobbyManager;
