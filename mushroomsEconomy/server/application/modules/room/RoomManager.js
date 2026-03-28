const CONFIG = require('../../../config');
const BaseManager = require('../BaseManager');
const Room = require('./Room');

class RoomManager extends BaseManager {
    constructor(options) {
        super(options);

        this.users = {};
        this.rooms = {};
        this.userToRoom = {}; 
        this.init();
    }

    init() {
        this.handleConnection(this.io);
    }

    handleConnection(io) {
        io.on('connection', (socket) => {
            console.log(`RoomManager: Client connected: ${socket.id}`);

            socket.on(CONFIG.SOCKET.CREATE_ROOM, (data) => this.socketCreateRoom(socket, data));
            socket.on(CONFIG.SOCKET.JOIN_ROOM, (data) => this.socketJoinRoom(socket, data));
            socket.on(CONFIG.SOCKET.LEAVE_ROOM, (data) => this.socketLeaveRoom(socket, data));
            socket.on(CONFIG.SOCKET.DROP_FROM_ROOM, (data) => this.socketKickUser(socket, data));
            socket.on(CONFIG.SOCKET.GET_ROOMS, (data) => this.socketGetRooms(socket, data));

            socket.on('disconnect', () => this.socketDisconnect(socket));
        });
    }

    sendError(socket, code) {
        socket.emit(CONFIG.SOCKET.ERROR, this.answer.bad(code));
    }

    socketCreateRoom(socket, data) {
        this.rooms[socket.id] = new Room(data.guid, data.roomName, this.common);
        socket.emit
    }

}

module.exports = RoomManager;