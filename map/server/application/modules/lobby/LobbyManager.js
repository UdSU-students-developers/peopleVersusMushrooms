const { MESSAGES } = require("../../../config");
const BaseManager = require("../BaseManager");
const Lobby = require("./Lobby");

class LobbyManager extends BaseManager {
    constructor(options) {
        super(options);
        
        this.lobbies = {}; 

        if (!this.io) return;

        // socket обработчики
        this.io.on('connection', (socket) => {
            socket.on(MESSAGES.CREATE_LOBBY, (data) => this.socketCreateLobby(data, socket));
            socket.on(MESSAGES.JOIN_TO_LOBBY, (data) => this.socketJoinToLobby(data, socket));
            socket.on(MESSAGES.LEAVE_LOBBY, (data) => this.socketLeaveLobby(data, socket));
            socket.on(MESSAGES.DROP_FROM_LOBBY, (data) => this.socketDropFromLobby(data, socket));
            socket.on(MESSAGES.START_GAME, (data) => this.socketStartGame(data, socket));
            socket.on(MESSAGES.GET_LOBBIES, (data) => this.socketGetLobbies(data, socket));
            socket.on(MESSAGES.SET_READY, (data) => this.socketSetReady(data, socket));
        });

        // mediator events
        this.mediator.subscribe(this.EVENTS.CREATE_LOBBY, (guid, lobbyName, role) => this.eventCreateLobby(guid, lobbyName, role));
        this.mediator.subscribe(this.EVENTS.JOIN_TO_LOBBY, (guid, lobbyGuid, role) => this.eventJoinToLobby(guid, lobbyGuid, role));
        this.mediator.subscribe(this.EVENTS.LEAVE_LOBBY, (guid) => this.eventLeaveLobby(guid));
        this.mediator.subscribe(this.EVENTS.DROP_FROM_LOBBY, (guid, targetGuid) => this.eventDropFromLobby(guid, targetGuid));
        this.mediator.subscribe(this.EVENTS.START_GAME, (guid) => this.eventStartGame(guid));
        this.mediator.subscribe(this.EVENTS.GET_LOBBIES, (guid) => this.eventGetLobbies(guid));
        this.mediator.subscribe(this.EVENTS.SET_READY, (guid) => this.eventSetReady(guid));
        this.mediator.subscribe(this.EVENTS.LOGOUT, (guid) => this.eventLogout(guid));

        // mediator triggers
        this.mediator.set(this.TRIGGERS.IS_GUID_IN_ANY_LOBBY, (guid) => this.triggerIsGuidInAnyLobby(guid));
    }

    // ============ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ============

    getUserByGuid(guid) {
        return this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
    }

    isGuidInAnyLobby(guid) {
        return Object.values(this.lobbies).find(lobby => lobby.isGuidInLobby(guid));
    }

    _notifyLobbyUpdate(lobbyGuid) {
        const lobby = this.lobbies[lobbyGuid];
        if (!lobby) return;

        const lobbyInfo = lobby.get();
        
        for (const guid of Object.values(lobby.playersGuids)) {
            if (guid) {
                const user = this.getUserByGuid(guid);
                if (user && user.socketId) {
                    const socket = this.io.sockets.sockets.get(user.socketId);
                    if (socket) {
                        socket.emit(MESSAGES.LOBBY_UPDATED, this.answer.good(lobbyInfo));
                    }
                }
            }
        }
    }

    _notifyLobbiesListUpdated() {
        const lobbies = Object.values(this.lobbies).map(lobby => lobby.get());
        console.log('список лобби:', JSON.stringify(lobbies, null, 2));
        this.io.emit(MESSAGES.LOBBIES_LIST_UPDATED, this.answer.good(lobbies));

        this.sendToAll('/lobbyUpdated', { lobbies });
    }

    _destroyLobby(lobbyGuid) {
        const lobby = this.lobbies[lobbyGuid];
        if (!lobby) return;

        for (const guid of Object.values(lobby.playersGuids)) {
            if (guid) {
                const user = this.getUserByGuid(guid);
                if (user && user.socketId) {
                    const socket = this.io.sockets.sockets.get(user.socketId);
                    if (socket) {
                        socket.emit(MESSAGES.LOBBY_DESTROYED, this.answer.good({ lobbyGuid }));
                    }
                }
            }
        }

        delete this.lobbies[lobbyGuid];
        this._notifyLobbiesListUpdated();
    }

    // ============ БИЗНЕС-ЛОГИКА ============

    _createLobby(guid, lobbyName, role) {
        //проверка пользователя
        const user = this.getUserByGuid(guid);
        if (!user) {
            return this.answer.bad(1001);
        }

        //проверка, не в лобби ли уже
        const existingLobby = this.isGuidInAnyLobby(user.guid);
        if (existingLobby) {
            this._destroyLobby(existingLobby.lobbyGuid);
        }

        //создаем лобби
        const lobby = new Lobby({ 
            lobbyGuid: user.guid,
            lobbyName,
            role
        });

        this.lobbies[user.guid] = lobby;

        return this.answer.good(lobby.get());
    }

    _joinToLobby(guid, lobbyGuid, role) {
        //проверка пользователя
        const user = this.getUserByGuid(guid);
        if (!user) {
            return this.answer.bad(1001);
        }

        //проверка существования лобби
        const lobby = this.lobbies[lobbyGuid];
        if (!lobby) {
            return this.answer.bad(2003);
        }

        //проверка, не в лобби ли уже
        const existingLobby = this.isGuidInAnyLobby(user.guid);
        if (existingLobby) {
            if (existingLobby.lobbyGuid === lobbyGuid) {
                return this.answer.bad(2005);
            }
            this._destroyLobby(existingLobby.lobbyGuid);
        }

        //проверка заполнености
        if (!lobby.canJoin()) {
            return this.answer.bad(2004);
        }

        //добавляем игрока
        if (!lobby.addPlayer(user.guid, role)) {
            return this.answer.bad(2017);
        }

        return this.answer.good(lobby.get());
    }

    _leaveLobby(guid) {
        //проверка пользователя
        const user = this.getUserByGuid(guid);
        if (!user) {
            return this.answer.bad(1001);
        }

        //находим лобби
        const lobby = this.isGuidInAnyLobby(user.guid);
        if (!lobby) {
            return this.answer.bad(2006);
        }

        const isCreator = (user.guid === lobby.lobbyGuid);
        
        //если создатель выходит - удаляем все лобби
        if (isCreator) {
            this._destroyLobby(lobby.lobbyGuid);
            return this.answer.good(true);
        }

        //удаляем игрока
        lobby.removePlayer(user.guid);

        return this.answer.good(true);
    }

    _dropFromLobby(guid, targetGuid) {
        //проверка на наличие данных
        if (!guid || !targetGuid) {
            return this.answer.bad(242);
        }

        //проверка создателя
        const creator = this.getUserByGuid(guid);
        if (!creator) {
            return this.answer.bad(1001);
        }

        //проверка цели
        const target = this.getUserByGuid(targetGuid);
        if (!target) {
            return this.answer.bad(2016);
        }

        //находим лобби
        const lobby = this.isGuidInAnyLobby(creator.guid);
        if (!lobby) {
            return this.answer.bad(2006);
        }

        //проверка, что создатель - владелец лобби
        if (creator.guid !== lobby.lobbyGuid) {
            return this.answer.bad(2010);
        }

        //проверка, что не кикает сам себя
        if (creator.guid === target.guid) {
            return this.answer.bad(2007);
        }

        //проверка, что цель в этом лобби
        if (!lobby.isGuidInLobby(target.guid)) {
            return this.answer.bad(2009);
        }

        //кикаем игрока
        lobby.removePlayer(target.guid);

        return this.answer.good(lobby.get());
    }

    _startGame(guid) {
        //проверка пользователя
        const user = this.getUserByGuid(guid);
        if (!user) {
            return this.answer.bad(1001);
        }

        //находим лобби
        const lobby = this.isGuidInAnyLobby(user.guid);
        if (!lobby) {
            return this.answer.bad(2006);
        }

        //проверка, что пользователь - создатель
        if (user.guid !== lobby.lobbyGuid) {
            return this.answer.bad(2010);
        }

        //проверка, что все готовы
        if (!lobby.canStarted()) {
            return this.answer.bad(2012);
        }

        //оповещаем через медиатор о старте игры
        this.mediator.call(this.EVENTS.START_GAME, {
            lobbyGuid: lobby.lobbyGuid,
            ...lobby.getGuids()
        });

        //удаляем лобби
        const lobbyGuid = lobby.lobbyGuid;
        this._destroyLobby(lobbyGuid);

        return this.answer.good(true);
    }

    _getLobbies(guid) {
        //проверка пользователя
        const user = this.getUserByGuid(guid);
        if (!user) {
            return this.answer.bad(1001);
        }

        const lobbies = Object.values(this.lobbies).map(lobby => lobby.get());
        return this.answer.good(lobbies);
    }

    _setReady(guid) {
        //проверка пользователя
        const user = this.getUserByGuid(guid);
        if (!user) {
            return this.answer.bad(1001);
        }

        //находим лобби
        const lobby = this.isGuidInAnyLobby(user.guid);
        if (!lobby) {
            return this.answer.bad(2006);
        }

        //устанавливаем статус ready
        if (!lobby.setPlayerReady(user.guid)) {
            return this.answer.bad(9000);
        }

        return this.answer.good(true);
    }

    // ============ SOCKETS ============

    async socketCreateLobby(data = {}, socket) {
        const result = this._createLobby(data.guid, data.lobbyName, data.role);
        
        if (result.result === 'error') {
            return socket.emit(MESSAGES.CREATE_LOBBY, result);
        }
        
        socket.emit(MESSAGES.CREATE_LOBBY, result);
        this._notifyLobbiesListUpdated();
    }

    async socketJoinToLobby(data = {}, socket) {
        const result = this._joinToLobby(data.guid, data.lobbyGuid, data.role);
        
        if (result.result === 'error') {
            return socket.emit(MESSAGES.JOIN_TO_LOBBY, result);
        }
        
        socket.emit(MESSAGES.JOIN_TO_LOBBY, result);
        this._notifyLobbyUpdate(data.lobbyGuid);
        this._notifyLobbiesListUpdated();
    }

    async socketLeaveLobby(data = {}, socket) {
        const result = this._leaveLobby(data.guid);
        
        if (result.result === 'error') {
            return socket.emit(MESSAGES.LEAVE_LOBBY, result);
        }
        
        socket.emit(MESSAGES.LEAVE_LOBBY, result);
        this._notifyLobbiesListUpdated();
    }

    async socketDropFromLobby(data = {}, socket) {
        const result = this._dropFromLobby(data.guid, data.targetGuid);
        
        if (result.result === 'error') {
            return socket.emit(MESSAGES.DROP_FROM_LOBBY, result);
        }
        
        socket.emit(MESSAGES.DROP_FROM_LOBBY, result);
        this._notifyLobbyUpdate(data.lobbyGuid);
        this._notifyLobbiesListUpdated();
    }

    async socketStartGame(data = {}, socket) {
        const result = this._startGame(data.guid);
        
        if (result.result === 'error') {
            return socket.emit(MESSAGES.START_GAME, result);
        }
        
        socket.emit(MESSAGES.START_GAME, result);
    }

    async socketGetLobbies(data = {}, socket) {
        const result = this._getLobbies(data.guid);
        
        if (result.result === 'error') {
            return socket.emit(MESSAGES.GET_LOBBIES, result);
        }
        
        socket.emit(MESSAGES.GET_LOBBIES, result);
    }

    async socketSetReady(data = {}, socket) {
        const result = this._setReady(data.guid);
        
        if (result.result === 'error') {
            return socket.emit(MESSAGES.SET_READY, result);
        }
        
        socket.emit(MESSAGES.SET_READY, result);
        this._notifyLobbiesListUpdated();
    }

    // ============ EVENTS ============

    async eventCreateLobby(guid, lobbyName, role) {
        const result = this._createLobby(guid, lobbyName, role);
        return result;
    }

    async eventJoinToLobby(guid, lobbyGuid, role) {
        const result = this._joinToLobby(guid, lobbyGuid, role);
        return result;
    }

    //eventLeaveLobby =?= eventLogout
    async eventLeaveLobby(guid) {
        const result = this._leaveLobby(guid);
        return result;
    }

    async eventDropFromLobby(guid, targetGuid) {
        const result = this._dropFromLobby(guid, targetGuid);
        return result;
    }

    async eventStartGame(guid) {
        const result = this._startGame(guid);
        return result;
    }

    async eventGetLobbies(guid) {
        const result = this._getLobbies(guid);
        return result;
    }

    async eventSetReady(guid) {
        const result = this._setReady(guid);
        return result;
    }

    async eventLogout(guid) {
        const result = this._leaveLobby(guid);
        return result;
    }

    // ============ TRIGGERS ===========

    triggerIsGuidInAnyLobby(guid) {
        const lobby = this.isGuidInAnyLobby(guid);
        return lobby ? lobby : null;
    }
}

module.exports = LobbyManager;