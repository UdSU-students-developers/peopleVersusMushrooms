const { MESSAGES } = require("../../../config");
const BaseManager = require("../BaseManager");
const Lobby = require("./Lobby");

class LobbyManager extends BaseManager {
    constructor(options) {
        super(options);
        
        this.lobbies = {}; 

        if (!this.io) return;

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
        this.mediator.subscribe(this.EVENTS.LOGOUT, (guid) => this.eventLogout(guid));
        this.mediator.subscribe(this.EVENTS.JOIN_TO_LOBBY, (data) => this.eventJoinToLobby(data));

        // mediator triggers
        this.mediator.set(this.TRIGGERS.IS_GUID_IN_ANY_LOBBY, (guid) => this.triggerIsGuidInAnyLobby(guid));
        this.mediator.set(this.TRIGGERS.GET_LOBBIES, (data) => this.triggerGetLobbies(data));
    }

    // ============ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ============

    //получение пользака
    getUserByGuid(guid) {
        return this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
    }

    //найти лобби по гуиду пользака
    isGuidInAnyLobby(guid) {
        return Object.values(this.lobbies).find(lobby => lobby.isGuidInLobby(guid));
    }

    _destroyLobby(lobbyGuid) {
        const lobby = this.lobbies[lobbyGuid];
        if (!lobby) return;

        //оповещаем всех в лобби об уничтожении
        for (const player of Object.values(lobby.playersGuids)) {
            if (player) {
                const user = this.getUserByGuid(player.guid);
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

    _notifyLobbyUpdate(lobbyGuid) {
        const lobby = this.lobbies[lobbyGuid];
        if (!lobby) return;

        const lobbyInfo = lobby.get();
        
        //оповещаем всех в лобби
        for (const player of Object.values(lobby.playersGuids)) {
            if (player) {
                const user = this.getUserByGuid(player.guid);
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
    }

    // ============ EVENTS ============

    //обработчик выхода пользователя
    async eventLogout(guid) {
        //находим лобби, где есть этот игрок
        const lobby = this.isGuidInAnyLobby(guid);
        if (!lobby) return;

        const isCreator = (guid === lobby.creatorGuid);
        
        //если создатель выходит - удаляем все лобби
        if (isCreator) {
            this._destroyLobby(lobby.guid);
        } else {
            //удаляем игрока
            lobby.removePlayer(guid);
        }
        this._notifyLobbyUpdate(lobby.guid);
        this._notifyLobbiesListUpdated();
    }

    eventJoinToLobby(data = {}) {
        const { guid, lobbyGuid, role } = data;
        
        
        const lobby = this.lobbies[lobbyGuid];
        if (!lobby) {
            return { error: 2003 };
        }

        const existingLobby = this.isGuidInAnyLobby(guid);
        if (existingLobby) {
            if (existingLobby.guid === lobbyGuid) {
                return { error: 2005 };
            }
            this._destroyLobby(existingLobby.guid);
        }

        if (!lobby.canJoin()) {
            return { error: 2004 };
        }

        if (!lobby.addPlayer(guid, role)) {
            return { error: 2017 };
        }

        this._notifyLobbyUpdate(lobbyGuid);
        this._notifyLobbiesListUpdated();

        const result = lobby.get();
        return result;
    }

    // ============ TRIGGERS ===========

    triggerIsGuidInAnyLobby(guid) {
        const lobby = this.isGuidInAnyLobby(guid);
        return lobby ? lobby : null;
    }

    triggerGetLobbies(data = {}) {
    const { guid } = data;
    
    //доделать
    
    const lobbies = Object.values(this.lobbies).map(lobby => lobby.get());
    return lobbies;
}

    // ============ SOCKETS ============

    async socketCreateLobby(data = {}, socket) {
        const { guid, lobbyName, role } = data;
        
        //валидация
        if (!guid || !lobbyName) {
            return socket.emit(MESSAGES.CREATE_LOBBY, this.answer.bad(242));
        }

        //проверка пользователя через медиатор
        const user = this.getUserByGuid(guid);
        if (!user) {
            return socket.emit(MESSAGES.CREATE_LOBBY, this.answer.bad(1001));
        }

        //проверка, не в лобби ли уже
        const existingLobby = this.isGuidInAnyLobby(user.guid);
        if (existingLobby) {
            this._destroyLobby(existingLobby.guid);
        }

        //создаем лобби
        const lobby = new Lobby({ 
            creatorGuid: user.guid,
            lobbyName,
            role,
            common: this.common
        });

        this.lobbies[user.guid] = lobby;

        socket.emit(MESSAGES.CREATE_LOBBY, this.answer.good(lobby.get()));
        this._notifyLobbiesListUpdated();
    }

    async socketJoinToLobby(data = {}, socket) {
        const { guid, lobbyGuid, role } = data;
        
        //валидация
        if (!guid || !lobbyGuid) {
            return socket.emit(MESSAGES.JOIN_TO_LOBBY, this.answer.bad(242));
        }

        //проверка существования лобби
        const lobby = this.lobbies[lobbyGuid];
        if (!lobby) {
            return socket.emit(MESSAGES.JOIN_TO_LOBBY, this.answer.bad(2003));
        }

        //проверка, не в лобби ли уже
        const existingLobby = this.isGuidInAnyLobby(user.guid);
        if (existingLobby) {
            if (existingLobby.guid === lobbyGuid) {
                return socket.emit(MESSAGES.JOIN_TO_LOBBY, this.answer.bad(2005));
            }
            this._destroyLobby(existingLobby.guid);
        }

        //проверка заполнености
        if (!lobby.canJoin()) {
            return socket.emit(MESSAGES.JOIN_TO_LOBBY, this.answer.bad(2004));
        }

        //добавляем игрока
        if (!lobby.addPlayer(user.guid, role)) {
            return socket.emit(MESSAGES.JOIN_TO_LOBBY, this.answer.bad(2017));
        }

        socket.emit(MESSAGES.JOIN_TO_LOBBY, this.answer.good(lobby.get()));
        this._notifyLobbyUpdate(lobbyGuid);
        this._notifyLobbiesListUpdated();
    }

    async socketLeaveLobby(data = {}, socket) {
        const { guid } = data;
        
        //валидация
        if (!guid) {
            return socket.emit(MESSAGES.LEAVE_LOBBY, this.answer.bad(242));
        }

        //проверка пользователя через медиатор
        const user = this.getUserByGuid(guid);
        if (!user) {
            return socket.emit(MESSAGES.LEAVE_LOBBY, this.answer.bad(1001));
        }

        //находим лобби, где есть этот игрок
        const lobby = this.isGuidInAnyLobby(user.guid);
        if (!lobby) {
            return socket.emit(MESSAGES.LEAVE_LOBBY, this.answer.bad(2006));
        }

        const isCreator = (user.guid === lobby.creatorGuid);
        
        //если создатель выходит - удаляем все лобби
        if (isCreator) {
            this._destroyLobby(lobby.guid);
            return socket.emit(MESSAGES.LEAVE_LOBBY, this.answer.good(true));
        }

        //удаляем игрока
        lobby.removePlayer(user.guid);

        socket.emit(MESSAGES.LEAVE_LOBBY, this.answer.good(true));
        this._notifyLobbyUpdate(lobby.guid);
        this._notifyLobbiesListUpdated();
    }

    async socketDropFromLobby(data = {}, socket) {
        const { guid, targetGuid } = data;
        
        //валидация
        if (!guid || !targetGuid) {
            return socket.emit(MESSAGES.DROP_FROM_LOBBY, this.answer.bad(242));
        }

        //проверка создателя через медиатор
        const creator = this.getUserByGuid(guid);
        if (!creator) {
            return socket.emit(MESSAGES.DROP_FROM_LOBBY, this.answer.bad(1001));
        }

        //проверка цели через медиатор
        const target = this.getUserByGuid(targetGuid);
        if (!target) {
            return socket.emit(MESSAGES.DROP_FROM_LOBBY, this.answer.bad(2016));
        }

        //находим лобби админа
        const lobby = this.isGuidInAnyLobby(creator.guid);
        if (!lobby) {
            return socket.emit(MESSAGES.DROP_FROM_LOBBY, this.answer.bad(2006));
        }

        //проверка, что админ - создатель
        if (creator.guid !== lobby.creatorGuid) {
            return socket.emit(MESSAGES.DROP_FROM_LOBBY, this.answer.bad(2010));
        }

        //проверка, что не кикает сам себя
        if (creator.guid === target.guid) {
            return socket.emit(MESSAGES.DROP_FROM_LOBBY, this.answer.bad(2007));
        }

        //проверка, что цель в этом лобби
        if (!lobby.isGuidInLobby(target.guid)) {
            return socket.emit(MESSAGES.DROP_FROM_LOBBY, this.answer.bad(2009));
        }

        //кикаем игрока
        lobby.removePlayer(target.guid);

        socket.emit(MESSAGES.DROP_FROM_LOBBY, this.answer.good(lobby.get()));
        this._notifyLobbyUpdate(lobby.guid);
        this._notifyLobbiesListUpdated();
    }

    async socketStartGame(data = {}, socket) {
        const { guid } = data;
        
        //валидация
        if (!guid) {
            return socket.emit(MESSAGES.START_GAME, this.answer.bad(242));
        }

        //проверка пользователя через медиатор
        const user = this.getUserByGuid(guid);
        if (!user) {
            return socket.emit(MESSAGES.START_GAME, this.answer.bad(1001));
        }

        //находим лобби
        const lobby = this.isGuidInAnyLobby(user.guid);
        if (!lobby) {
            return socket.emit(MESSAGES.START_GAME, this.answer.bad(2006));
        }

        //проверка, что пользователь - создатель
        if (user.guid !== lobby.creatorGuid) {
            return socket.emit(MESSAGES.START_GAME, this.answer.bad(2010));
        }

        //проверка, что все готовы
        if (!lobby.canStarted()) {
            return socket.emit(MESSAGES.START_GAME, this.answer.bad(2012));
        }

        this.mediator.call(this.EVENTS.START_GAME, {
            lobbyGuid: lobby.guid,
            ...lobby.getGuids()
        });

        //убиваем лобби
        this._destroyLobby(lobby.creatorGuid);

        socket.emit(MESSAGES.START_GAME, this.answer.good(true));
    }

    async socketGetLobbies(data = {}, socket) {
        const { guid } = data;
        
        //валидация
        if (!guid) {
            return socket.emit(MESSAGES.GET_LOBBIES, this.answer.bad(242));
        }

        //проверка пользователя через медиатор
        const user = this.getUserByGuid(guid);
        if (!user) {
            return socket.emit(MESSAGES.GET_LOBBIES, this.answer.bad(1001));
        }

        //собираем лобби
        const lobbies = Object.values(this.lobbies).map(lobby => lobby.get());
        socket.emit(MESSAGES.GET_LOBBIES, this.answer.good(lobbies));
    }

    async socketSetReady(data = {}, socket) {
        const { guid } = data;
        
        //валидация
        if (!guid) {
            return socket.emit(MESSAGES.SET_READY, this.answer.bad(242));
        }

        //проверка пользователя
        const user = this.getUserByGuid(guid);
        if (!user) {
            return socket.emit(MESSAGES.SET_READY, this.answer.bad(1001));
        }

        //находим лобби, где есть этот игрок
        const lobby = this.isGuidInAnyLobby(user.guid);
        if (!lobby) {
            return socket.emit(MESSAGES.SET_READY, this.answer.bad(2006));
        }

        //устанавливаем статус ready
        if (!lobby.setPlayerReady(user.guid)) {
            return socket.emit(MESSAGES.SET_READY, this.answer.bad(9000));
        }

        socket.emit(MESSAGES.SET_READY, this.answer.good(true));
        this._notifyLobbyUpdate(lobby.guid);
        this._notifyLobbiesListUpdated();
    }

}

module.exports = LobbyManager;