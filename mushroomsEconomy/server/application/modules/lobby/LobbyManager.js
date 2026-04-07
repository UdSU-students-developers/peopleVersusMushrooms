const CONFIG = require('../../../config');
const BaseManager = require('../BaseManager');

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

            socket.on(SOCKET.CREATE_LOBBY, (data) => this.socketCreateLobby(data, socket));
            socket.on(SOCKET.JOIN_TO_LOBBY, (data) => this.socketJoinToLobby(data, socket));
            socket.on(SOCKET.LEAVE_LOBBY, (data) => this.socketLeaveLobby(data, socket));
            socket.on(SOCKET.DROP_FROM_LOBBY, (data) => this.socketDropFromLobby(data, socket));
            socket.on(SOCKET.START_GAME, (data) => this.socketStartGame(data, socket));
            socket.on(SOCKET.GET_LOBBIES, (data) => this.socketGetLobbies(data, socket));
            socket.on(SOCKET.SET_READY, (data) => this.socketSetReady(data, socket));

            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
		
		this.mediator.subscribe(this.EVENTS.LOBBY_UPDATED, (lobbies) => this.eventLobbyUpdated(lobbies));
    }

    handleDisconnect(socket) {
        //console.log("LobbyManager: Client disconnected:", socket.id)
    }
	
	/* TRIGGERS */
	
	/* EVENTS */
	eventLobbyUpdated(lobbies) {
		
		console.log('я выстрелил в менеджере!!!', lobbies);
		
	}
	
	/* SOCKETS */
    socketCreateLobby(data, socket) {
        const { guid } = data;
        const map = new Map();

        this.mediator.call(this.EVENTS.START_GAME, {
            guid: guid,
            map: map.generate(), //Должно приходить с одноимённого сервиса
        });
    }

    socketJoinToLobby (data, socket) {
        
    }

    socketLeaveLobby (data, socket) {
        
    }

    socketDropFromLobby (data, socket) {
        
    }

    socketStartGame (data, socket) {
        
    }

    socketGetLobbies (data, socket) {
        
    }

    socketSetReady (data, socket) {

    }

    
}

module.exports = LobbyManager;