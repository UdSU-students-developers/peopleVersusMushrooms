const { MESSAGES } = require("../../../config");
const BaseManager = require("../BaseManager");
const Lobby = require("./Lobby");

class LobbyManager extends BaseManager {
    constructor(options) {
        super(options);
        
        this.lobbies = {}; 

        if (!this.io) return;

        this.io.on('connection', (socket) => {
            socket.on(MESSAGES.CREATE_ROOM, (data) => this.socketCreateRoom(data, socket));
            socket.on(MESSAGES.JOIN_TO_ROOM, (data) => this.socketJoinToRoom(data, socket));
            socket.on(MESSAGES.LEAVE_ROOM, (data) => this.socketLeaveRoom(data, socket));
            socket.on(MESSAGES.DROP_FROM_ROOM, (data) => this.socketDropFromRoom(data, socket));
            socket.on(MESSAGES.START_GAME, (data) => this.socketStartGame(data, socket));
            socket.on(MESSAGES.GET_ROOMS, (data) => this.socketGetRooms(data, socket));
        });

        // mediator events
        this.mediator.subscribe(this.EVENTS.LOGOUT, (guid) => this.eventLogout(guid));
    }

    // ============ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ============

    getUserByGuid(guid) {
        return this.userManager ? this.userManager.getUserByGuid(guid) : null;
    }

    getUserBySocketId(socketId) {
        return this.userManager ? this.userManager.getUserBySocketId(socketId) : null;
    }

    _destroyLobby(lobby) {
        // по guid игроков взять пользователей из UserManager
        // и разослать им сообщение об уничтожении комнаты
        // ОСТАЛЬНЫМ guid-ам разослать сообщения в соотвествующие микросервисы
        //...

        delete this.lobbies[lobby.creatorGuid];
    }

    // ============ СОКЕТ МЕТОДЫ ============

    // ВЕЗДЕ ТОКЕН ПОМЕНЯТЬ НА ГУИД

    /*
    async socketCreateRoom(data = {}, socket) {
        const { guid, roomName, role } = data;
        
        //валидация
        if (!guid || !roomName) {
            return socket.emit(MESSAGES.CREATE_ROOM, this.answer.bad(242));
        }

        
        //проверка пользователя
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (!user) {
            return socket.emit(MESSAGES.CREATE_ROOM, this.answer.bad(1001));
        }

        const lobby = Object.values(this.lobbies).find(lobby => lobby.isGuidInRoom(user.guid));
        if (lobby) {
            this._destroyLobby(lobby);
        }

        //создаем комнату
        const lobbies[user.guid] = new Lobby({ 
            creatorGuid: user.guid,
            roomName, 
            role,
            common: this.common
        });

        socket.emit(MESSAGES.CREATE_ROOM, this.answer.good(true));
        this._notifyRoomsListUpdated();
    }*/

    async socketJoinToRoom(data = {}, socket) {
        const { token, roomGuid } = data;
        
        //валидация
        if (!token || !roomGuid) {
            return socket.emit(MESSAGES.JOIN_TO_ROOM, this.answer.bad(242));
        }

        //проверка пользователя
        const user = this.getUserByToken(token);
        if (!user) {
            return socket.emit(MESSAGES.JOIN_TO_ROOM, this.answer.bad(1001));
        }

        //проверка существования комнаты
        const lobby = this.lobbies.get(roomGuid);
        if (!lobby) {
            return socket.emit(MESSAGES.JOIN_TO_ROOM, this.answer.bad(2003));
        }

        //проверка на заполненность
        if (lobby.players.length >= lobby.maxPlayers) {
            return socket.emit(MESSAGES.JOIN_TO_ROOM, this.answer.bad(2004));
        }

        //проверка статуса комнаты
        if (lobby.status !== 'open') {
            return socket.emit(MESSAGES.JOIN_TO_ROOM, this.answer.bad(2005));
        }

        //проверка, не в комнате ли уже
        const currentRoomGuid = this.userToRoom.get(user.guid);
        if (currentRoomGuid) {
            //уже в этой комнате
            if (currentRoomGuid === roomGuid) {
                return socket.emit(MESSAGES.JOIN_TO_ROOM, this.answer.bad(2005));
            }
            
            //проверка, не играет ли в другой
            const currentLobby = this.lobbies.get(currentRoomGuid);
            if (currentLobby && currentLobby.gameState === 'playing') {
                return socket.emit(MESSAGES.JOIN_TO_ROOM, this.answer.bad(2001));
            }
            
            //выходим из другой комнаты
            await this._leaveRoom(user.guid);
        }

        //добавляем игрока
        lobby.addPlayer(user);
        this.userToRoom.set(user.guid, roomGuid);

        //если комната заполнилась - закрываем
        if (lobby.players.length >= lobby.maxPlayers) {
            lobby.setStatus('closed');
        }

        console.log(`Сокет ${socket.id} присоединился к комнате ${roomGuid}`);
        
        socket.emit(MESSAGES.JOIN_TO_ROOM, this.answer.good(lobby.getSelf()));
        this._notifyRoomUpdate(roomGuid);
        this._notifyRoomsListUpdated();
    }

    async socketLeaveRoom(data = {}, socket) {
        const { token } = data;
        
        //валидация
        if (!token) {
            return socket.emit(MESSAGES.LEAVE_ROOM, this.answer.bad(242));
        }

        //проверка пользователя
        const user = this.getUserByToken(token);
        if (!user) {
            return socket.emit(MESSAGES.LEAVE_ROOM, this.answer.bad(1001));
        }

        //проверка, что пользователь в комнате
        const roomGuid = this.userToRoom.get(user.guid);
        if (!roomGuid) {
            return socket.emit(MESSAGES.LEAVE_ROOM, this.answer.bad(2006));
        }

        //проверка существования комнаты
        const lobby = this.lobbies.get(roomGuid);
        if (!lobby) {
            this.userToRoom.delete(user.guid);
            return socket.emit(MESSAGES.LEAVE_ROOM, this.answer.bad(2003));
        }

        const isCreator = (user.guid === lobby.creator);
        
        //если создатель выходит - удаляем всю комнату
        if (isCreator) {
            this.lobbies.delete(roomGuid);
            for (const player of lobby.players) {
                this.userToRoom.delete(player.guid);
            }
            this._notifyRoomsListUpdated();
            console.log(`Сокет ${socket.id} (создатель) удалил комнату ${roomGuid}`);
            return socket.emit(MESSAGES.LEAVE_ROOM, this.answer.good(true));
        }

        //если не создатель - просто выходим
        lobby.removePlayer(user.guid);
        this.userToRoom.delete(user.guid);

        //если комната пуста - удаляем
        if (lobby.players.length === 0) {
            this.lobbies.delete(roomGuid);
        } else {
            //открываем комнату
            lobby.setStatus('open');
            this._notifyRoomUpdate(roomGuid);
        }

        this._notifyRoomsListUpdated();
        console.log(`Сокет ${socket.id} покинул комнату ${roomGuid}`);
        socket.emit(MESSAGES.LEAVE_ROOM, this.answer.good(true));
    }

   async socketDropFromRoom(data = {}, socket) {
        const { token, targetGuid } = data;
        
        //валидация
        if (!token || !targetGuid) {
            return socket.emit(MESSAGES.DROP_FROM_ROOM, this.answer.bad(242));
        }

        //проверка админа
        const admin = this.getUserByToken(token);
        if (!admin) {
            return socket.emit(MESSAGES.DROP_FROM_ROOM, this.answer.bad(1001));
        }

        //проверка цели по гуиду
        const target = this.getUserByGuid(targetGuid);
        if (!target) {
            return socket.emit(MESSAGES.DROP_FROM_ROOM, this.answer.bad(2016));
        }

        //проверка, что админ в комнате
        const roomGuid = this.userToRoom.get(admin.guid);
        if (!roomGuid) {
            return socket.emit(MESSAGES.DROP_FROM_ROOM, this.answer.bad(2006));
        }

        //проверка существования комнаты
        const lobby = this.lobbies.get(roomGuid);
        if (!lobby) {
            this.userToRoom.delete(admin.guid);
            return socket.emit(MESSAGES.DROP_FROM_ROOM, this.answer.bad(2003));
        }

        //проверка, что админ - создатель
        if (admin.guid !== lobby.creator) {
            return socket.emit(MESSAGES.DROP_FROM_ROOM, this.answer.bad(2010));
        }

        //проверка, что не кикает сам себя
        if (admin.guid === target.guid) {
            return socket.emit(MESSAGES.DROP_FROM_ROOM, this.answer.bad(2007));
        }

        //проверка, что цель в этой комнате
        if (this.userToRoom.get(target.guid) !== roomGuid) {
            return socket.emit(MESSAGES.DROP_FROM_ROOM, this.answer.bad(2009));
        }

        //кикаем игрока
        lobby.removePlayer(target.guid);
        this.userToRoom.delete(target.guid);
        lobby.setStatus('open');

        console.log(`Сокет ${socket.id} выгнал игрока ${target.guid} из комнаты ${roomGuid}`);

        socket.emit(MESSAGES.DROP_FROM_ROOM, this.answer.good(lobby.getSelf()));
        this._notifyRoomUpdate(roomGuid);
        this._notifyRoomsListUpdated();
    }

    async socketStartGame(data = {}, socket) {
        const { token } = data;
        
        //валидация
        if (!token) {
            return socket.emit(MESSAGES.START_GAME, this.answer.bad(242));
        }

        //проверка пользователя
        const user = this.getUserByToken(token);
        if (!user) {
            return socket.emit(MESSAGES.START_GAME, this.answer.bad(1001));
        }

        //проверка, что пользователь в комнате
        const roomGuid = this.userToRoom.get(user.guid);
        if (!roomGuid) {
            return socket.emit(MESSAGES.START_GAME, this.answer.bad(2006));
        }

        //проверка существования комнаты
        const lobby = this.lobbies.get(roomGuid);
        if (!lobby) {
            this.userToRoom.delete(user.guid);
            return socket.emit(MESSAGES.START_GAME, this.answer.bad(2003));
        }

        //проверка, что пользователь - создатель
        if (user.guid !== lobby.creator) {
            return socket.emit(MESSAGES.START_GAME, this.answer.bad(2010));
        }

        //проверка статуса комнаты - должна быть закрыта
        if (lobby.status !== 'closed') {
            return socket.emit(MESSAGES.START_GAME, this.answer.bad(2015));
        }

        //проверка количества игроков
        if (lobby.players.length < lobby.maxPlayers) {
            return socket.emit(MESSAGES.START_GAME, this.answer.bad(2012));
        }

        //проверка статуса всех игроков
        let allReady = true;
        for (const player of lobby.players) {
            if (lobby.getPlayerStatus(player.guid) !== 'ready') {
                allReady = false;
                break;
            }
        }

        if (!allReady) {
            return socket.emit(MESSAGES.START_GAME, this.answer.bad(2012));
        }

        //начинаем игру
        lobby.setGameState('playing');
        lobby.setStatus('started');

        //меняем статус всех игроков
        for (const player of lobby.players) {
            lobby.setPlayerStatus(player.guid, 'started');
        }

        console.log(`Сокет ${socket.id} начал игру в комнате ${roomGuid}`);

        socket.emit(MESSAGES.START_GAME, this.answer.good(lobby.getSelf()));
        this._notifyRoomUpdate(roomGuid);
        this._notifyRoomsListUpdated();
    }

    async socketGetRooms(data = {}, socket) {
        const { token } = data;
        
        //валидация
        if (!token) {
            return socket.emit(MESSAGES.GET_ROOMS, this.answer.bad(242));
        }

        //проверка пользователя
        const user = this.getUserByToken(token);
        if (!user) {
            return socket.emit(MESSAGES.GET_ROOMS, this.answer.bad(1001));
        }

        //собираем комнаты
        const rooms = [];
        for (const lobby of this.lobbies.values()) {
            if (lobby.status === 'open' || lobby.status === 'closed') {
                rooms.push(lobby.get());
            }
        }

        socket.emit(MESSAGES.GET_ROOMS, this.answer.good(rooms));
    }

    socketDisconnect(socket) {
        const user = this.getUserBySocketId(socket.id);
        
        if (user) {
            console.log(`Пользак ${user.guid} отключился от LobbyManager сокета ${socket.id}`);
        } else {
            console.log(`Анонимус отключился от LobbyManager сокета ${socket.id}`);
        }
    }

    // ============ ВНУТРЕННИЕ МЕТОДЫ ============

    //для принудительного удаления пользака из комнаты, тупо обновляет состояние
    async _leaveRoom(userGuid) {
        const roomGuid = this.userToRoom.get(userGuid);
        if (!roomGuid) return false;

        const lobby = this.lobbies.get(roomGuid);
        if (!lobby) {
            this.userToRoom.delete(userGuid);
            return false;
        }

        const isCreator = (userGuid === lobby.creator);
        const wasPlaying = (lobby.gameState === 'playing');
        
        //если создатель выходит во время игры - удаляем комнату
        if (isCreator && wasPlaying) {
            this.lobbies.delete(roomGuid);
            for (const player of lobby.players) {
                this.userToRoom.delete(player.guid);
            }
            return true;
        }

        //удаляем игрока
        lobby.removePlayer(userGuid);
        this.userToRoom.delete(userGuid);

        //если создатель ушел, передаем права
        if (isCreator && lobby.players.length > 0) {
            lobby.setCreator(lobby.players[0].guid);
        }

        //если комната пуста - удаляем
        if (lobby.players.length === 0) {
            this.lobbies.delete(roomGuid);
        } else if (lobby.gameState !== 'playing') {
            //открываем комнату
            lobby.setStatus('open');
        }

        return true;
    }

    //рассылка инфы при входах/выходах в комнате
    _notifyRoomUpdate(roomGuid) {
        const lobby = this.lobbies.get(roomGuid);
        if (!lobby) return;

        const roomInfo = lobby.getSelf();
        
        //оповещаем всех в комнате
        for (const player of lobby.players) {
            const user = this.getUserByGuid(player.guid);
            if (user && user.socketId) {
                const socket = this.io.sockets.sockets.get(user.socketId);
                if (socket) {
                    socket.emit(MESSAGES.ROOM_UPDATED, this.answer.good(roomInfo));
                }
            }
        }
    }

    //рассылка инфы о изменение списка доступных комнат
    _notifyRoomsListUpdated() {
        this.io.emit(MESSAGES.ROOMS_LIST_UPDATED, this.answer.good(
            Object.values(lobby => lobby.get())
        ));
    }
}

module.exports = LobbyManager;