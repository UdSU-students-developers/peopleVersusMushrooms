const BaseManager = require('../BaseManager');
const CONFIG = require('../../../config');
const User = require('./User');

const { REGISTRATION, LOGIN, LOGOUT } = CONFIG.SOCKET;

class UserManager extends BaseManager {
    constructor(options) {
        super(options);
		// data
        this.users = {}; // Ключ guid значение new User
		// sockets
        if (!this.io) return;
        this.io.on('connection', (socket) => {
            socket.on(REGISTRATION, (data) => this.socketRegistration(data, socket));
            socket.on(LOGIN, (data) => this.socketLogin(data, socket));
            socket.on(LOGOUT, (data) => this.socketLogout(data, socket));
            socket.on('disconnect', () => console.log('disconnect', socket.id));
        });

        // mediator events subscribers
		//...
        // mediator triggers setters
		this.mediator.set(this.TRIGGERS.GET_USER_BY_GUID, (guid) => this.triggerGetUserByGuid(guid));
    }

    /* PRIVATE */
	
	/* TRIGGERS */
	triggerGetUserByGuid(guid) {
		if (guid && this.users[guid] && this.users[guid].isLogin()) {
			return this.users[guid];
		}
		return null;
	}
	
	/* EVENTS */
	//...

    /* SOCKETS */
    async socketRegistration(data = {}, socket) {
        const { name, passwordHash } = data;
        if (!name || !passwordHash) {
            return socket.emit(REGISTRATION, this.answer.bad(13));
        }
        const user = new User({db: this.db, common: this.common, socketId: socket.id});
        if (await user.registration(name, passwordHash)) {
            this.users[user.guid] = user;
            socket.emit(REGISTRATION, this.answer.good(user.getSelf()));
            return;
        }

        socket.emit(REGISTRATION, this.answer.bad(17));
    }

    async socketLogin(data = {}, socket) {
        const { name, passwordHash } = data;
        if (!name || !passwordHash) {
            return socket.emit(LOGIN, this.answer.bad(13));
        }
        const user = new User({ db: this.db, common: this.common, socketId: socket.id });
        if (await user.login(name, passwordHash)) {
            this.users[user.guid] = user;
            socket.emit(LOGIN, this.answer.good(user.getSelf()));


            //TEMPORARY
            const map = [];
            for (let i = 0; i < 50; i++) {
                map.push([]);
                for (let j = 0; j < 50; j++) {
                    map[i][j] = 0;
                }
            }
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

            this.mediator.call(this.EVENTS.START_GAME, {
                guid: user.guid,
                map,
            });
            return;
            //TEMPORARY END
        }
        socket.emit(LOGIN, this.answer.bad(11));
    }

    async socketLogout(data = {}, socket) {
        const { token, guid } = data;
        if (!token) {
            return socket.emit(LOGOUT, this.answer.bad(13));
        }
        const user = this.users[guid];
        if (user) {
            await user.logout();
            delete this.users[guid];
            socket.emit(LOGOUT, this.answer.good(true));
            return;
        }

        socket.emit(LOGOUT, this.answer.bad(19));
    }
}

module.exports = UserManager;