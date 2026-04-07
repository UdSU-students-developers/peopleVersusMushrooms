const CONFIG = require('../../../config');
const BaseManager = require('../BaseManager');
const Lobby = require('./Lobby');

//TEMPORARY
const Map = require('../map/Map');

const { SOCKET } = CONFIG;

class LobbyManager extends BaseManager {
    constructor(options) {
        super(options);

        this.lobbies = {};

		if (!this.io) return;
        this.io.on('connection', (socket) => {
            //console.log(`LobbyManager: Client connected: ${socket.id}`);

            socket.on(SOCKET.CREATE_LOBBY, (data) => this.socketCreateLobby(socket, data));
            socket.on(SOCKET.JOIN_LOBBY, (data) => this.socketJoinLobby(socket, data));
            socket.on(SOCKET.LEAVE_LOBBY, (data) => this.socketLeaveLobby(socket, data));
            socket.on(SOCKET.REMOVE_LOBBY, (data) => this.socketLeaveLobby(socket, data));

            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
		
		this.mediator.subscribe(this.EVENTS.LOBBY_UPDATED, (lobbies) => this.eventLobbyUpdated(lobbies));
    }

    handleDisconnect(socket) {
        console.log("LobbyManager: Client disconnected:", socket.id)
    }
	
	/* TRIGGERS */
	
	/* EVENTS */
	eventLobbyUpdated(lobbies) {
		
		console.log('я выстрелил в менеджере!!!', lobbies);
		
	}
	
	/* SOCKETS */
    socketCreateLobby(socket, data) {
        const { guid } = data;
        const map = new Map();

        if (this.lobbies[guid]) {
            this.mediator.call(this.EVENTS.LOAD_GAME, { guid });
            return;
        }

        this.lobbies[guid] = new Lobby({
            creatorGuid: guid,
            common: this.common,
            socket: socket
        });
        this.mediator.call(this.EVENTS.START_GAME, {
            guid: guid,
            map: map.generate(), //Должно приходить с одноимённого сервиса
        });
    }

    socketJoinLobby(socket, data) {
        
    }

    socketLeaveLobby(socket, data) {

    }
}

module.exports = LobbyManager;