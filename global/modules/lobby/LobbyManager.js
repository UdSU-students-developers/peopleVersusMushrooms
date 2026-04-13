//GLOBAL
const GLOBAL_CONFIG = require('../../globalConfig')
const BaseManager = require('../../../global/modules/BaseManager');

//LOCAL
//...

const { SOCKET } = GLOBAL_CONFIG;

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
                guid: guid, 
                lobbyGuid: lobbyGuid, 
                role: this.role, 
            });
            return;
        }
        socket.emit(SOCKET.JOIN_TO_LOBBY, this.answer.bad(1001));
    }
    
    socketCreateLobby(data, socket) {
        const { guid, lobbyName } = data;
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (user) {
            this.sendToMap('/createLobby', {
                guid: guid,
                lobbyName: lobbyName,
                role: this.role,
            });
            return;
        } 
        socket.emit(SOCKET.CREATE_LOBBY, this.answer.bad(1001));


    }
    
    socketLeaveLobby(data, socket) {
        const { guid } = data;
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (user) {
            this.sendToMap('/leaveLobby', { guid });
            return;
        }
        socket.emit(SOCKET.LEAVE_LOBBY, this.answer.bad(1001));
    }
    
    socketDropFromLobby(data, socket) {
        const { guid, targetGuid } = data;
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (user) {
            this.sendToMap('/dropFromLobby', { guid, targetGuid });
            return;
        }
        socket.emit(SOCKET.DROP_FROM_LOBBY, this.answer.bad(1001));
    }
    
    socketStartGame(data, socket) {
        const { guid } = data;
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (user) {
            this.sendToMap('/startGame', { guid });
            return;
        }
        socket.emit(SOCKET.START_GAME, this.answer.bad(1001));
    }
    
    socketGetLobbies(data, socket) {
        const { guid } = data;
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (user) {
            this.sendToMap('/getLobbies', { guid });
            return;
        }
        socket.emit(SOCKET.GET_LOBBIES, this.answer.bad(1001));
    }
    
    socketSetReady(data, socket) {
        const { guid } = data;
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (user) {
            this.sendToMap('/setReady', { guid });
            return;
        }
        socket.emit(SOCKET.SET_READY, this.answer.bad(1001));
    }

    
}

module.exports = LobbyManager;