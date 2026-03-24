const BaseManager = require("../BaseManager");
const CONFIG = require("../../../config");
const Economy = require('../../economy/Economy');

const { GET_MAP } = CONFIG.SOCKET;

class GameManager extends BaseManager {
    constructor(options) {
        super(options);
		// data
        this.economies = {};
		// sockets
        if (!this.io) return;
        this.io.on('connection', (socket) => {
            //socket.on(GET_MAP, (data) => this.getMap(data, socket));
        });
		// mediator events subscribers
		this.mediator.subscribe(this.EVENTS.START_GAME, (data) => this.eventStartGame(data));
		// mediator triggers setters
		//...
    }
	
	/* PRIVATE */
	callbackUpdate(guid, data) {
		const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
		if (user) {
			this.io.to(user.socketId).emit(
				this.SOCKETS.UPDATE_SCENE, 
				this.answer.good(data)
			);
			return;
		}
		this.io.to(user.socketId).emit(this.SOCKETS.UPDATE_SCENE, this.answer.bad(16));		
	}
	
    _createEconomy(guid, startPoint, map) {
        this.economies[guid] = new Economy({
            db: this.db,
            common: this.common,
            callbacks: {
				update: (guid, data) => this.callbackUpdate(guid, data)
			},
            map,
            guid,
        });
        return this.economies[guid];
    }
	
	/* TRIGGERS */
	
	/* EVENTS */
	eventStartGame(data = {}) {
		const { guid, startPoint, map } = data;
		const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
		if (user) {
			const economy = this._createEconomy(guid, startPoint, map);	
			this.io.to(user.socketId).emit(
				this.SOCKETS.START_GAME, 
				this.answer.good(economy.getSelf())
			);
			return;
		}
		this.io.to(user.socketId).emit(this.SOCKETS.START_GAME, this.answer.bad(16));		
	}
	
	/* SOCKETS */

    getMap(data = {}, socket) {
        //console.log(data, '\n\n\n\n\n\n');
        const { guid } = data;
        console.log("Запрос на получение карты");

        if (guid) {
            const economy = this.createEconomy();
            const { map } = economy.get();
            return socket.emit(GET_MAP, this.answer.good({ guid: economy.guid, map }));
        }

        const economy = this.economies[guid];
        if (!economy) {
            return socket.emit(GET_MAP, this.answer.bad(18));
        }

        const { map } = economy.get();
        return socket.emit(GET_MAP, this.answer.good({ guid, map }));
    }

}

module.exports = GameManager;
