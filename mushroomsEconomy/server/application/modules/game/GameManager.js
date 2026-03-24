const BaseManager = require("../BaseManager");
const CONFIG = require("../../../config");
const Economy = require('../../economy/Economy');

const { GET_SCENE } = CONFIG.SOCKET;

class GameManager extends BaseManager {
    constructor(options) {
        super(options);
		// data
        this.economies = {};
		// sockets
        if (!this.io) return;
        this.io.on('connection', (socket) => {
            socket.on(GET_SCENE, (data) => this.socketGetScene(data, socket));
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
				updated: (data) => this.callbackUpdate(guid, data)
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
            console.log(1111);
			this.io.to(user.socketId).emit(
				this.SOCKETS.START_GAME, 
				this.answer.good(economy.get())
			);
			return;
		}
		this.io.to(user.socketId).emit(this.SOCKETS.START_GAME, this.answer.bad(16));		
	}
	
	/* SOCKETS */

    socketGetScene(data = {}, socket) {
        //console.log(data, '\n\n\n\n\n\n');
        const { guid } = data;
        //console.log("Запрос на получение карты");


        const economy = this.economies[guid];
        if (!economy) {
            return socket.emit(GET_SCENE, this.answer.bad(18));
        }

        socket.emit(GET_SCENE, this.answer.good(economy.get()));
    }

}

module.exports = GameManager;