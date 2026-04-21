const { URLS } = require("../../../../../global/globalConfig");
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
        this.mediator.subscribe(this.EVENTS.CREATE_LOBBY, (data) => this._eventAnswer(data, '_createLobby'));
        this.mediator.subscribe(this.EVENTS.JOIN_TO_LOBBY, (data) => this._eventAnswer(data, '_joinToLobby'));
        this.mediator.subscribe(this.EVENTS.LEAVE_LOBBY, (data) => this._eventAnswer(data, '_leaveLobby'));
        this.mediator.subscribe(this.EVENTS.DROP_FROM_LOBBY, (data) => this._eventAnswer(data, '_dropFromLobby'));
        this.mediator.subscribe(this.EVENTS.START_GAME, (data) => this._eventAnswer(data, '_startGame'));
        this.mediator.subscribe(this.EVENTS.GET_LOBBIES, (_) => this._eventAnswer(_, '_getLobbies'));
        this.mediator.subscribe(this.EVENTS.SET_READY, (data) => this._eventAnswer(data, '_setReady'));
        this.mediator.subscribe(this.EVENTS.LOGOUT, (data) => this._eventAnswer(data, '_leaveLobby'));

        // mediator triggers
    }

    // ============ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ============

    getUserByGuid(guid) {
        return this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
    }

    isGuidInAnyLobby(guid) {
        return Object.values(this.lobbies).find(lobby => lobby.isGuidInLobby(guid));
    }

    _notifyLobbiesListUpdated() {
        const lobbies = Object.values(this.lobbies).map(lobby => lobby.get());
        console.log('список лобби:', JSON.stringify(lobbies, null, 2));
        this.io.emit(MESSAGES.LOBBIES_LIST_UPDATED, this.answer.good(lobbies));
        this.sendToAll(URLS.LOBBY_UPDATED, { lobbies });
    }

    _destroyLobby(lobbyGuid) {
        const lobby = this.lobbies[lobbyGuid];
        if (!lobby) return;
        for (const guid of Object.values(lobby.playersGuids)) {
            if (guid) {
                const user = this.getUserByGuid(guid);
                if (user) {
                    this.io.to(user.socketId).emit(MESSAGES.LOBBY_DESTROYED, this.answer.good({ lobbyGuid }));
                }
            }
        }
        delete this.lobbies[lobbyGuid];
        this._notifyLobbiesListUpdated();
    }

    _checkError(condition, error) {
        if (condition) {
            return this.answer.bad(error);
        }
        return null
    }
    

    // ============ БИЗНЕС-ЛОГИКА ============

    _createLobby({ guid, lobbyName, role }) {
        //проверка, не в лобби ли уже
        const existingLobby = this.isGuidInAnyLobby(guid);
        if (existingLobby) {
            this._destroyLobby(existingLobby.lobbyGuid);
        }

        //создаем лобби
        const lobby = new Lobby({
            lobbyGuid: guid,
            lobbyName,
            role
        });

        this.lobbies[guid] = lobby;

        return this.answer.good(lobby.get());
    }

    _joinToLobby({ guid, lobbyGuid, role }) {
        let e;
        //проверка существования лобби
        const lobby = this.lobbies[lobbyGuid];
        if (e = this._checkError(!lobby, 2003)) return e;

        //проверка, не в лобби ли уже
        const existingLobby = this.isGuidInAnyLobby(guid);
        if (existingLobby) {
            if (existingLobby.lobbyGuid === lobbyGuid) {
                return this.answer.bad(2005);
            }
            this._destroyLobby(existingLobby.lobbyGuid);
        }

        //проверка заполнености
        if (e = this._checkError(!lobby.canJoin(), 2004)) return e;

        //добавляем игрока
        if (e = this._checkError(!lobby.addPlayer(guid, role), 2017)) return e;

        return this.answer.good(lobby.get());
    }

    _leaveLobby({ guid }) {
        let e;
        //находим лобби
        const lobby = this.isGuidInAnyLobby(guid);
        if (e = this._checkError(!lobby, 2006)) return e;

        const isCreator = (guid === lobby.lobbyGuid);

        //если создатель выходит - удаляем все лобби
        if (isCreator) {
            this._destroyLobby(lobby.lobbyGuid);
            return this.answer.good(true);
        }

        //удаляем игрока
        lobby.removePlayer(guid);

        return this.answer.good(true);
    }

    _dropFromLobby({ guid, targetGuid }) {
        let e;
        //находим лобби
        const lobby = this.isGuidInAnyLobby(guid);
        if (e = this._checkError(!lobby, 2006)) return e;

        //проверка, что создатель - владелец лобби
        if (e = this._checkError(guid !== lobby.lobbyGuid, 2010)) return e;

        //проверка, что не кикает сам себя
        if (e = this._checkError(guid === targetGuid, 2007)) return e;

        //проверка, что цель в этом лобби
        if (e = this._checkError(!lobby.isGuidInLobby(targetGuid), 2009)) return e;

        //кикаем игрока
        lobby.removePlayer(targetGuid);

        return this.answer.good(lobby.get());
    }

    _startGame({ guid }) {
        let e;
        //находим лобби
        const lobby = this.isGuidInAnyLobby(guid);
        if (e = this._checkError(!lobby, 2006)) return e;

        //проверка, что пользователь - создатель
        if (e = this._checkError(guid !== lobby.lobbyGuid, 2010)) return e;

        //проверка, что все готовы
        if (e = this._checkError(!lobby.canStarted(), 2012)) return e;

        //оповещаем через медиатор о старте игры
        this.mediator.call(this.EVENTS.START_GAME, lobby.getGuids());

        //удаляем лобби
        const lobbyGuid = lobby.lobbyGuid;
        this._destroyLobby(lobbyGuid);

        return this.answer.good(true);
    }

    _getLobbies() {
        const lobbies = Object.values(this.lobbies).map(lobby => lobby.get());
        return this.answer.good(lobbies);
    }

    _setReady({ guid }) {
        let e;
        //находим лобби
        const lobby = this.isGuidInAnyLobby(guid);
        if (e = this._checkError(!lobby, 2006)) return e;

        //устанавливаем статус ready
        if (e = this._checkError(!lobby.setPlayerReady(guid), 1001)) return e;

        return this.answer.good(true);
    }

    // ============ TRIGGERS ===========
    //...

    // ============ EVENTS ============
    _eventAnswer(data, method) {
        const result = this[method](data);
        this._notifyLobbiesListUpdated();
        return result;
    }

    // ============ SOCKETS ============
    _socketAnswer(data, socket, method, MESSAGE) {
        const result = this._eventAnswer(data, method);
        socket.emit(MESSAGE, result);
    }

    socketCreateLobby(data = {}, socket) {
        this._socketAnswer(data, socket, '_createLobby', MESSAGES.CREATE_LOBBY);
    }

    socketJoinToLobby(data = {}, socket) {
        this._socketAnswer(data, socket, '_joinToLobby', MESSAGES.JOIN_TO_LOBBY);
    }

    socketLeaveLobby(data = {}, socket) {
        this._socketAnswer(data, socket, '_leaveLobby', MESSAGES.LEAVE_LOBBY);
    }

    socketDropFromLobby(data = {}, socket) {
        this._socketAnswer(data, socket, '_dropFromLobby', MESSAGES.DROP_FROM_LOBBY);
    }

    socketStartGame(data = {}, socket) {
        this._socketAnswer(data, socket, '_startGame', MESSAGES.START_GAME);
    }

    socketSetReady(data = {}, socket) {
        this._socketAnswer(data, socket, '_setReady', MESSAGES.SET_READY);
    }

    socketGetLobbies(_, socket) {
        socket.emit(MESSAGES.GET_LOBBIES, this._getLobbies());
    }
}

module.exports = LobbyManager;