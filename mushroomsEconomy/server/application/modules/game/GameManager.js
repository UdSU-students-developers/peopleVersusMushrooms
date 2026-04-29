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
		this.mediator.set(this.TRIGGERS.SET_SERIVCES_GUIDS, (guids) => this.triggerSetServicesGuids(guids));

		this.mediator.set(this.TRIGGERS.GROW_LARVA, (guid) => this.triggerGrowLarva(guid));
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
				this.SOCKETS.UPDATE_SCENE,
				this.answer.good(data)
			);
			return;
		}
		this.io.to(user.socketId).emit(this.SOCKETS.UPDATE_SCENE, this.answer.bad(1002));
	}

	/* TRIGGERS */

	triggerSetServicesGuids(guids = {}, data) {
		if (guids) {
			this.economies[data.guid].initGuids(guids);
		}
	}

	triggerGrowLarva(guid) {
		const economy = this.economies[guid];

		if (!economy) {
			return { success: false, message: 'Economy not found' };
		}

		return economy.growFirstLarva();
	}

	/* EVENTS */
	eventStartGame(data = {}) {
		const { guids, startPoint } = data;
		if (guids?.mushroomsEconomy) {
			const guid = guids.mushroomsEconomy;
			const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
			if (user && user.socketId) {
				this.economies[guid] = new Economy({
					db: this.db,
					common: this.common,
					callbacks: {
						updated: (data) => this.callbackUpdate(guid, data),
						spawnArmyUnit: this.spawnArmyUnit(unitType, data),
					},
					guid,
					guids, 
					startPoint
				});
				const economy = this.economies[guid];

				economy.units.larvae.push({
					x: 5,
					y: 5,
				});

				console.log('--- GROW LARVA DEBUG START ---');

				console.log('BEFORE:', economy.units.larvae.length);

				const result = economy.growFirstLarva();

				console.log('RESULT:', result);

				console.log('AFTER:', economy.units.larvae.length);

				console.log('--- GROW LARVA DEBUG END ---');
				this.io.to(user.socketId).emit(
					this.SOCKETS.START_GAME,
					this.answer.good(this.economies[guid].get())
				);
				console.log("Экдономика созана");
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