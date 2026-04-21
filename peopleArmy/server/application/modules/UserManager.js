const path = require('path');
const Module = require('module');
const CONFIG = require('../../config');

const localNodeModulesPath = path.resolve(__dirname, '../../node_modules');
const nodePathParts = (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean);

if (!nodePathParts.includes(localNodeModulesPath)) {
    process.env.NODE_PATH = [...nodePathParts, localNodeModulesPath].join(path.delimiter);
    Module._initPaths();
}

const GlobalUserManager = require('../../../../global/modules/user/UserManager');
const User = require('../../../../global/modules/user/User');

const { REGISTRATION, LOGIN, LOGOUT } = CONFIG.SOCKETS;

const SOCKET_NAME_MAP = {
    REGISTRATION,
    LOGIN,
    LOGOUT,
};

function createSocketAdapter(io) {
    if (!io) {
        return io;
    }

    return {
        on(eventName, handler) {
            if (eventName !== 'connection') {
                return io.on(eventName, handler);
            }

            return io.on('connection', (socket) => handler(createSocketAdapterSocket(socket)));
        },
        to(...args) {
            return io.to(...args);
        },
        emit(...args) {
            return io.emit(...args);
        },
    };
}

function createSocketAdapterSocket(socket) {
    return new Proxy(socket, {
        get(target, prop) {
            if (prop === 'on') {
                return (eventName, handler) => target.on(SOCKET_NAME_MAP[eventName] || eventName, handler);
            }

            if (prop === 'emit') {
                return (eventName, ...args) => target.emit(SOCKET_NAME_MAP[eventName] || eventName, ...args);
            }

            return Reflect.get(target, prop);
        },
    });
}

class PeopleArmyUserManager extends GlobalUserManager {
    constructor(options) {
        super({
            ...options,
            io: createSocketAdapter(options.io),
        });
    }

    createUser(socket) {
        return new User({
            db: this.db,
            common: this.common,
            socketId: socket.id,
        });
    }

    buildStartMap() {
        const map = Array(50).fill().map(() => Array(50).fill(0));
        map[39][25] = 1;
        map[40][25] = 1;
        map[41][25] = 1;
        map[42][25] = 1;
        map[43][25] = 1;
        map[44][25] = 1;
        map[45][25] = 1;
        map[46][25] = 1;
        map[47][25] = 1;
        map[48][25] = 1;
        map[49][25] = 1;
        map[5][25] = 1;
        return map;
    }

    startGameForUser(user) {
        this.mediator.call(this.EVENTS.START_GAME, {
            guid: user.guid,
            map: this.buildStartMap(),
            buildings: [],
        });
    }

    dropUser(user, socket = null) {
        this.mediator.call(this.EVENTS.USER_DISCONNECT, { guid: user.guid });
        delete this.users[user.guid];

        if (socket?.data) {
            delete socket.data.guid;
        }
    }

    async handleDisconnect(socket) {
        const user = this.triggerGetUserBySocketId(socket.id);
        if (!user || !user.isLogin()) {
            return;
        }

        await user.logout();
        this.dropUser(user, socket);
        console.log(`пользователь с guid: ${user.guid} отключился`);
    }

    async socketRegistration(data = {}, socket) {
        const { name, password, passwordHash } = data;
        const secret = passwordHash || password;

        if (!name || !secret) {
            return socket.emit(REGISTRATION, this.answer.bad(13));
        }

        const user = this.createUser(socket);
        if (await user.registration(name, secret)) {
            this.users[user.guid] = user;
            socket.data.guid = user.guid;
            socket.emit(REGISTRATION, this.answer.good(user.getSelf()));
            this.startGameForUser(user);
            return;
        }

        socket.emit(REGISTRATION, this.answer.bad(17));
    }

    async socketLogin(data = {}, socket) {
        const { name, password, passwordHash } = data;
        const secret = passwordHash || password;

        if (!name || !secret) {
            return socket.emit(LOGIN, this.answer.bad(13));
        }

        const user = this.createUser(socket);
        if (await user.login(name, secret)) {
            this.users[user.guid] = user;
            socket.data.guid = user.guid;
            socket.emit(LOGIN, this.answer.good(user.getSelf()));
            this.startGameForUser(user);
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
        this.dropUser(user, socket);
        socket.emit(LOGOUT, this.answer.good(true));
    }
}

module.exports = PeopleArmyUserManager;
