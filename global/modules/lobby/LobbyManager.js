const CONFIG = require('../../config')
const BaseManager = require('../BaseManager');

const { SOCKET } = CONFIG;

class LobbyManager extends BaseManager {
    constructor({ options, role }) { //Роль берите из своего конфига, она совпадает с названием вашего сервиса, например 'mushroomEconomy'
        super(options);

        this.role = role;

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
		this.io.emit(SOCKET.LOBBY_UPDATED, this.answer.good(lobbies));
	}
	
	/* SOCKETS */
    
    socketJoinToLobby (data = {}, socket) {
        const { guid, lobbyGuid } = data;
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (user) {
            this.sendToMap('/joinToLobby', { 
                guid, 
                lobbyGuid, 
                role: this.role, 
            });
            return;
        }
        socket.emit(SOCKET.JOIN_TO_LOBBY, this.answer.bad(9000));
    }
    
    socketCreateLobby(data, socket) {

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