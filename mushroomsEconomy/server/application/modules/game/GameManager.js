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
		this.io.on('connection', (socket) => {
			//
		 });
		// mediator events subscribers
		this.mediator.subscribe(this.EVENTS.START_GAME, (data) => this.eventStartGame(data));
		this.mediator.subscribe(this.EVENTS.LOAD_GAME, (data) => this.eventLoadGame(data));
		// mediator triggers setters
		//...
	}

	/* PRIVATE */
	callbackUpdate(guid, data) {
		const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);

		// выплюнуть сообщение в карту
		// получить ответ
		// запросить рельеф
		// запросить видимость
		// запросить ресурсы под жопками рабочих
		// обновить рельеф и видимость у себя в Экномике
		// ответить на СВОЙ клиент

		if (user) {
			this.io.to(user.socketId).emit(
				GLOBAL_CONFIG.SOCKET.UPDATE_SCENE,
				this.answer.good(data)
			);
			return;
		}
		this.io.to(user.socketId).emit(GLOBAL_CONFIG.SOCKET.UPDATE_SCENE, this.answer.bad(1002));
	}

	/* TRIGGERS */


	/* EVENTS */
	eventStartGame(data = {}) {

		const { guids, startPoint } = data;
		//console.log(guids);
		//console.log(SET_SERVICES_GUIDS);

		if (guids?.mushroomsEconomy) {
			const guid = guids.mushroomsEconomy;
			const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
			if (user && user.socketId) {
				this.economies[guid] = new Economy({
					db: this.db,
					common: this.common,
					callbacks: {
						updated: (data) => this.callbackUpdate(guid, data),
						spawnArmyUnit: (data) => this.spawnArmyUnit(data),
					},
					guids, 
					startPoint
				});
				this.mediator.set(
					CONFIG.MEDIATOR.TRIGGERS.GET_MUSHROOMS_ECONOMY,
					({ guid }) => this.economies[guid]
				);
				this.io.to(user.socketId).emit(
					GLOBAL_CONFIG.SOCKET.START_GAME,
					this.answer.good(this.economies[guid].get())
				);
				console.log("Экономика создана");
				return this.answer.good(true);
			}
			return this.answer.bad(1001)
		}
		return this.answer.bad(4001);
	}

	spawnArmyUnit(data) { //data = {unitType, x, y, armyGuid}
		this.sendToMushroomsArmy(GLOBAL_CONFIG.URLS.SPAWN_UNIT, data);
	}

	/* SOCKETS */
}

module.exports = GameManager;