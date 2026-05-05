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
		this.mediator.subscribe(this.EVENTS.APPLY_DAMAGE, (data) => this.eventApplyDamage(data));
		// mediator triggers setters
		//...
	}

	/* PRIVATE */
	callbackUpdate(data) {

		const guid = data.guids.mushroomsEconomy;
		const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
		console.log(user);
		console.log(data);
		console.log(guid);

		// выплюнуть сообщение в карту
		// получить ответ
		// запросить рельеф
		// запросить видимость
		// запросить ресурсы под жопками рабочих
		// обновить рельеф и видимость у себя в Экномике
		// ответить на СВОЙ клиент
		if (user) {
			const relief = this.sendToMap(GLOBAL_CONFIG.URLS.GET_RELIEF, { mapGuid, userGuid: guid });

			if (relief && Array.isArray(relief)) {
				this.setRelief(guid, relief);
			}
			
			this.io.to(user.socketId).emit(
				CONFIG.SOCKET.UPDATE_SCENE,
				this.answer.good(data)
			);
			return;
		}
		this.io.to(user.socketId).emit(CONFIG.SOCKET.UPDATE_SCENE, this.answer.bad(1002));
	}

	async getResources(guid, mapGuid) {
		const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);

		if (!user) {
			return this.answer.bad(1002);
		}

		const resources = await this.sendToMap(
			GLOBAL_CONFIG.URLS.GET_RESOURSE_VISIBILITY,
			{ mapGuid, userGuid: guid }
		);
		console.log("RESOURCES FROM MAP:", resources);

		if (this.economies[guid]) {
			this.economies[guid].setResources(resources);
		}

		this.io.to(user.socketId).emit(
			CONFIG.SOCKET.UPDATE_SCENE,
			this.answer.good({ resources })
		);

		return this.answer.good(resources);
	}

	async getResources(guid, mapGuid) {
		const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);

		if (!user) {
			return this.answer.bad(1002);
		}

		const resources = await this.sendToMap(
			GLOBAL_CONFIG.URLS.GET_RESOURSE_VISIBILITY,
			{ mapGuid, userGuid: guid }
		);
		console.log("RESOURCES FROM MAP:", resources);

		if (this.economies[guid]) {
			this.economies[guid].setResources(resources);
		}

		this.io.to(user.socketId).emit(
			GLOBAL_CONFIG.SOCKET.UPDATE_SCENE,
			this.answer.good({ resources })
		);

		return this.answer.good(resources);
	}

	/* TRIGGERS */
	
	
	/* EVENTS */
	eventStartGame(data = {}) {
		
		const { guids, startPoint } = data;
		console.log('EVENT START GAME');
		//console.log(guids);
		//console.log(SET_SERVICES_GUIDS);
		
		if (guids.mushroomsEconomy) {
			const guid = guids.mushroomsEconomy;
			const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
			if (user && user.socketId) {
				this.economies[guid] = new Economy({
					db: this.db,
					common: this.common,
					callbacks: {
						updated: (data) => this.callbackUpdate(data),
						spawnArmyUnit: (data) => this.spawnArmyUnit(data),
					},
					guids, 
					startPoint
				});
				const sceneData = this.economies[guid].get();

				this.io.to(user.socketId).emit(
					GLOBAL_CONFIG.SOCKET.START_GAME,
					sceneData
				);
				this.getResources(guid, mapGuid);
				console.log("Экономика создана");
				return sceneData;
			}
			return this.answer.bad(1001)
		}
		return this.answer.bad(4001);
	}
	
	eventApplyDamage(data = {}) {
		const { guid, damage, economyGuid } = data;
		const economy = this.economies[economyGuid];

		if (!economy) {
			return false;
		}

		return economy.applyDamage(guid, damage);
	}
	
	setRelief(guid, relief) {
		if (this.economies[guid]) {
			this.economies[guid].setRelief(relief);
		}
	}

	spawnArmyUnit(data) { //data = {unitType, x, y, armyGuid}
		this.sendToMushroomsArmy(GLOBAL_CONFIG.URLS.SPAWN_UNIT, data);
	}


	/* SOCKETS */
}

module.exports = GameManager;