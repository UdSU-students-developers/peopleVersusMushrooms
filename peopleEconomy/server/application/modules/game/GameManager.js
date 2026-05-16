//GLOBAL
const BaseManager = require('../../../../../global/modules/BaseManager');
const GLOBAL_CONFIG = require('../../../../../global/globalConfig');

// LOCAL
const CONFIG = require("../../../config");
const Economy = require('../../economy/Economy');


class GameManager extends BaseManager {
	constructor(options) {
		super(options);
		// data
		this.economies = {};
		// sockets
		if (!this.io) return;
		this.io.on('connection', (socket) => { });
		// mediator events subscribers
		this.mediator.subscribe(this.EVENTS.START_GAME, (data) => this.eventStartGame(data));
		this.mediator.subscribe(this.EVENTS.LOAD_GAME, (data) => this.eventLoadGame(data));
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
		this.io.to(user.socketId).emit(this.SOCKETS.UPDATE_SCENE, this.answer.bad(1002));
	}

	_createEconomy(guid, startPoint, map) {
		this.economies[guid] = new Economy({
			db: this.db,
			common: this.common,
			callbacks: {
				updated: (data) => this.callbackUpdate(guid, data)
			},
			map: map,
			guid: guid,
		});
		return this.economies[guid];
	}

	/* TRIGGERS */

	/* EVENTS */
	eventStartGame(data = {}) {
		const { guid, startPoint, map } = data;
		const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
		if (user && user.socketId) {
			if (this.economies[guid]) {
				this.io.to(user.socketId).emit(
					this.SOCKETS.START_GAME,
					this.answer.good(this.economies[guid].get())
				);
				return
			}
			this.economies[guid] = this._createEconomy(guid, startPoint, map);
			this.io.to(user.socketId).emit(
				this.SOCKETS.START_GAME,
				this.answer.good(this.economies[guid].get())
			);
			console.log("Экономика создана");
			return;
		}
		if (user) {
			this.io.to(user.socketId).emit(this.SOCKETS.START_GAME, this.answer.bad(1002));
		}
	}

	/* SOCKETS */
}

module.exports = GameManager;