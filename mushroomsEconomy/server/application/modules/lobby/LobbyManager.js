const CONFIG = require('../../../config');
const BaseManager = require('../BaseManager');
const Lobby = require('./Lobby');

const { SOCKET } = CONFIG;

class LobbyManager extends BaseManager {
    constructor(options) {
        super(options);

        this.users = {};
        this.lobbies = {};

        this.init();
    }

    init() {
        this.handleConnection(this.io);
    }

    handleConnection(io) {
        io.on('connection', (socket) => {
            console.log(`LobbyManager: Client connected: ${socket.id}`);

            socket.on(SOCKET.CREATE_LOBBY, (data) => this.socketCreateLobby(socket, data));
            socket.on(SOCKET.JOIN_LOBBY, (data) => this.socketJoinLobby(socket, data));
            socket.on(SOCKET.LEAVE_LOBBY, (data) => this.socketLeaveLobby(socket, data));
            socket.on(SOCKET.REMOVE_LOBBY, (data) => this.socketLeaveLobby(socket, data));

            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
    }

    handleDisconnect(socket) {
        console.log("LobbyManager: Client disconnected:", socket)
    }

    socketCreateLobby(socket, data) {
        const { guid } = data;

        this.lobbies[guid] = new Lobby({guid, common, socket})
    }

    socketJoinLobby(socket, data) {
        
    }

    socketLeaveLobby(socket, data) {

    }
}

module.exports = LobbyManager;