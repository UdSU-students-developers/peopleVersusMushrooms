const CONFIG = require('../../../config');
const BaseManager = require('../BaseManager')

class LobbyManager extends BaseManager {
    constructor(options) {
        super(options);
        this.users = {}; 

        this.init();
    }

    init() {
        this.handleConnection(this.io);
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

    getUser(socket) { 
        return this.users[socket.id];
    }

    async handleLogin(socket, data) {
        if (!data || !data.name) return this.sendError(socket, 16);
        
        const user = { id: this.common.guid(), name: data.name };
        this.users[socket.id] = user;

        const rooms = await this.db.getAllRooms();
        
        socket.emit('login_success', { 
            user, 
            rooms: rooms 
        });
    }

    async handleCreateRoom(socket, data) {
        const user = this.getUser(socket);
        if (!user) return this.sendError(socket, 17);

        if (!data || !data.name) return this.sendError(socket, 18);

        const room = await this.db.createRoom(data.name, user.id);
        
        socket.emit('room_created', room);
        socket.broadcast.emit('room_created', room);
    }

    async handleDeleteRoom(socket, data) {
        const user = this.getUser(socket);
        if (!user) return this.sendError(socket, 17);

        const room = await this.db.getRoomById(data.roomId);
        if (!room) return this.sendError(socket, 19);

        if (room.ownerId !== user.id) return this.sendError(socket, 20);

        await this.db.deleteRoom(room.id);

        socket.broadcast.emit('room_deleted', { roomId: room.id });
        socket.emit('room_deleted', { roomId: room.id });
    }

    async handleJoinRoom(socket, data) {
        const user = this.getUser(socket);
        if (!user) return this.sendError(socket, 17);

        const room = await this.db.getRoomById(data.roomId);
        if (!room) return this.sendError(socket, 19);

        if (!room.participants.includes(user.id)) {
            room.participants.push(user.id);
            await this.db.saveRoom(room);
        }

        socket.emit('room_updated', room);
        socket.broadcast.emit('room_updated', room);
    }

    async handleKickUser(socket, data) {
        const user = this.getUser(socket);
        if (!user) return this.sendError(socket, 17);

        const room = await this.db.getRoomById(data.roomId);
        if (!room) return this.sendError(socket, 19);

        if (room.ownerId !== user.id) return this.sendError(socket, 20);

        room.participants = room.participants.filter(id => id !== data.userId);
        
        await this.db.saveRoom(room);

        socket.emit('room_updated', room);
        socket.broadcast.emit('room_updated', room);
    }

    handleDisconnect(socket) {
        delete this.users[socket.id];
    }
}

module.exports = LobbyManager;
