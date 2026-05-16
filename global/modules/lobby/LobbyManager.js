const BaseManager = require('../BaseManager');

class LobbyManager extends BaseManager {
    constructor(options, role) { //Роль берите из своего конфига, она совпадает с названием вашего сервиса, например 'mushroomEconomy'
        super(options);
        
        this.role = role;

		if (!this.io) return;
        this.io.on('connection', (socket) => {
            socket.on(this.SOCKET.CREATE_LOBBY, (data) => this.socketCreateLobby(data, socket));
            socket.on(this.SOCKET.JOIN_TO_LOBBY, (data) => this.socketJoinToLobby(data, socket));
            socket.on(this.SOCKET.LEAVE_LOBBY, (data) => this.socketLeaveLobby(data, socket));
            socket.on(this.SOCKET.DROP_FROM_LOBBY, (data) => this.socketDropFromLobby(data, socket));
            socket.on(this.SOCKET.START_GAME, (data) => this.socketStartGame(data, socket));
            socket.on(this.SOCKET.GET_LOBBIES, (data) => this.socketGetLobbies(data, socket));
            socket.on(this.SOCKET.SET_READY, (data) => this.socketSetReady(data, socket));
        });
		
        this.mediator.subscribe(this.EVENTS.DELETE_USER, (guid) => this.eventDeleteUser(guid));
		this.mediator.subscribe(this.EVENTS.LOBBY_UPDATED, (lobbies) => this.eventLobbyUpdated(lobbies));
    }

    /* PRIVATE */
    async _socketHandler(data, socket, METHOD, SOCKET) {
        const { guid } = data;
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (user) {
            const result = await this.sendToMap(METHOD, { 
                ...data, 
                role: this.role, 
            });
            socket.emit(SOCKET, result);
            return;
        }
        socket.emit(SOCKET, this.answer.bad(1001));
    }

	/* TRIGGERS */
    //...
	
	/* EVENTS */
    eventDeleteUser(guid) {
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (user) {
            this.sendToMap('/leaveLobby', { 
                guid, 
                role: this.role, 
            });
        }
    }

	eventLobbyUpdated(lobbies) {
		this.io.emit(this.SOCKET.LOBBIES_LIST_UPDATED, this.answer.good(lobbies));
	}
	
	/* SOCKETS */
    socketJoinToLobby (data = {}, socket) {
        this._socketHandler(data, socket, '/joinToLobby', this.SOCKET.JOIN_TO_LOBBY);
    }
    
    socketCreateLobby(data = {}, socket) {
        this._socketHandler(data, socket, '/createLobby', this.SOCKET.CREATE_LOBBY);
    }
    
    socketLeaveLobby(data = {}, socket) {
        this._socketHandler(data, socket, '/leaveLobby', this.SOCKET.LEAVE_LOBBY);
    }
    
    socketDropFromLobby(data = {}, socket) {
        this._socketHandler(data, socket, '/dropFromLobby', this.SOCKET.DROP_FROM_LOBBY);
    }
    
    socketStartGame(data = {}, socket) {
        this._socketHandler(data, socket, '/startGame', this.SOCKET.START_GAME);
    }
    
    socketGetLobbies(data = {}, socket) {
        this._socketHandler(data, socket, '/getLobbies', this.SOCKET.GET_LOBBIES);
    }
    
    socketSetReady(data = {}, socket) {
        this._socketHandler(data, socket, '/setReady', this.SOCKET.SET_READY);
    }
}

module.exports = LobbyManager;