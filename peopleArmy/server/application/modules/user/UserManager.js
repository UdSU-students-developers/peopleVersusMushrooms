const CONFIG = require('../../../config');
const BaseManager = require('../../../../../global/modules/BaseManager');
const User = require('./User');

const { REGISTRATION, LOGIN, LOGOUT } = CONFIG.SOCKETS;

class UserManager extends BaseManager {
    constructor(options) {
        super(options);
        this.users = {};
        // sockets
        if (!this.io) return;
        this.io.on('connection', (socket) => {
            socket.on(REGISTRATION, (data) => this.socketRegistration(data, socket));
            socket.on(LOGIN, (data) => this.socketLogin(data, socket));
            socket.on(LOGOUT, (data) => this.socketLogout(data, socket));
            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
        // mediator event subscribers
        //...
        // mediator trigger setters
        this.mediator.set(this.TRIGGERS.GET_USER_BY_GUID, (guid) => this.triggerGetUserByGuid(guid))
    }

    /* PRIVATE */
    //...

    /* TRIGGERS */
    triggerGetUserByGuid(guid) {
        if (guid && this.users[guid] && this.users[guid].isLogin()) {
            return this.users[guid];
        }
        return null;
    }

    /* EVENTS */
    //...

    async handleDisconnect(socket) {
        const guid = socket?.data?.guid;
        const user = this.triggerGetUserByGuid(guid);
        if (!user || !user.isLogin()) {
            return;
        }
        await user.logout();
        this.mediator.call(this.EVENTS.USER_DISCONNECT, { guid: user.guid });
        delete this.users[user.guid];
        console.log(`пользователь с guid: ${user.guid} отключился`);
    }

    /* SOCKETS */
    async socketRegistration(data = {}, socket) {
        const { name, password } = data;
        if (!name || !password) {
            return socket.emit(REGISTRATION, this.answer.bad(13));
        }
        const user = new User({
            db: this.db,
            common: this.common,
            socketId: socket.id
        });
        if (await user.registration(name, password)) {
            this.users[user.guid] = user;
            socket.data.guid = user.guid;
            socket.emit(REGISTRATION, this.answer.good(user.getSelf()));

            const map = Array(50).fill().map(() => Array(50).fill(0));
            map[39][25] = 1; map[40][25] = 1; map[41][25] = 1; map[42][25] = 1; map[43][25] = 1; map[44][25] = 1; map[45][25] = 1; map[46][25] = 1; map[47][25] = 1; map[48][25] = 1; map[49][25] = 1; map[5][25] = 1;
            this.mediator.call(this.EVENTS.START_GAME, {
                guid: user.guid,
                map,
                buildings: []
            });
            return;
        }
        socket.emit(REGISTRATION, this.answer.bad(17));
    }

    async socketLogin(data = {}, socket) {
        const { name, password } = data;
        if (!name || !password) {
            return socket.emit(LOGIN, this.answer.bad(13));
        }
        const user = new User({
            db: this.db,
            common: this.common,
            socketId: socket.id
        });
        if (await user.login(name, password)) {
            this.users[user.guid] = user;
            socket.data.guid = user.guid;
            socket.emit(LOGIN, this.answer.good(user.getSelf()));

            const map = Array(50).fill().map(() => Array(50).fill(0));
            map[39][25] = 1; map[40][25] = 1; map[41][25] = 1; map[42][25] = 1; map[43][25] = 1; map[44][25] = 1; map[45][25] = 1; map[46][25] = 1; map[47][25] = 1; map[48][25] = 1; map[49][25] = 1; map[5][25] = 1;
            this.mediator.call(this.EVENTS.START_GAME, {
                guid: user.guid,
                map,
                buildings: []
            });
            return;
        }
        socket.emit(LOGIN, this.answer.bad(11));
    }

    async socketLogout(data = {}, socket) {
        const { token, guid } = data;
        if (!token) {
            return socket.emit(LOGOUT, this.answer.bad(13));
        }
        const user = this.users[guid];
        if (!user || !user.isLogin()) {
            return socket.emit(LOGOUT, this.answer.bad(11));
        }
        await user.logout();
        this.mediator.call(this.EVENTS.USER_DISCONNECT, { guid: user.guid });
        delete this.users[user.guid];
        if (socket.data) {
            delete socket.data.guid;
        }
        socket.emit(LOGOUT, this.answer.good(true));
    }
}

module.exports = UserManager;
