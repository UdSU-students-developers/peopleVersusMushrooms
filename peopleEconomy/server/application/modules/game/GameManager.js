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
		this.mediator.subscribe(this.EVENTS.DAMAGE, (data) => this.eventApplyDamage(data));
		this.mediator.subscribe(this.EVENTS.MOVE_UNIT, (data) => this.eventMoveUnit(data));
		// mediator triggers setters
		//...
	}

	/* PRIVATE */
	callbackUpdate(data) {

		const { mapGuid } = data.guids;
		const guid = data.guids.peopleEconomy;
		const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
		if (!user) {
			console.log('User отсутствует!, callbackUpdate не работает! \n map guid: ', mapGuid);
			return;
		}

		// выплюнуть сообщение в карту
		this.updateBuildings(data.guids, this.economies[guid].getUpdatedBuildings());
		// выплюнуть сообщение в карту
		this.updateUnits(data.guids, this.economies[guid].getUpdatedUnits());
		// формате отдавать в сервис карты
		// получить ответ
		// запросить рельеф
		// this.getRelief(data.map, guid, mapGuid);
		// запросить видимость
		this.getVisibility(data.map, guid, mapGuid);
		// запросить ресурсы под жопками рабочих
		this.getResources(data.map, guid, mapGuid);
		// обновить рельеф и видимость у себя в Экномике
		// ответить на СВОЙ клиент
		this.io.to(user.socketId).emit(
			CONFIG.SOCKET.UPDATE_SCENE,
			this.answer.good(data)
		);
		//this.io.to(user.socketId).emit(CONFIG.SOCKET.UPDATE_SCENE, this.answer.bad(1002));
	}

	/* TRIGGERS */

	/* EVENTS */
	eventStartGame(data = {}) {
		
		const { guids } = data;
		console.log('EVENT START GAME');
		//console.log(guids);
		//console.log(SET_SERVICES_GUIDS);
		if (guids.peopleEconomy) {
			const guid = guids.peopleEconomy;
			const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
			if (user && user.socketId) {
				this.economies[guid] = new Economy({
					common: this.common,
					callbacks: {
						updated: (data) => this.callbackUpdate(data),
						spawnArmyUnit: (data) => this.spawnArmyUnit(data),
					},
					guids  
				});
				const sceneData = this.economies[guid].get();
				
				this.io.to(user.socketId).emit(
					GLOBAL_CONFIG.SOCKET.START_GAME,
					sceneData
				);
				//this.getResources(guid, mapGuid);
				console.log("Экономика создана");
				this.getRelief(this.economies[guid].map, guid, this.economies[guid].guids.mapGuid);
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

	async getRelief(map, guid, mapGuid) {
		if (typeof(map.relief[0][0]) !== "object") return;
		const relief = await this.sendToMap(GLOBAL_CONFIG.URLS.GET_RELIEF, { mapGuid, userGuid: guid });
		
		if (relief) {
			if (this.economies[guid]) {
				this.economies[guid].setRelief(relief);
			}
		}
		
	}

	async getResources(map, guid, mapGuid) {
		const resources = await this.sendToMap(
			GLOBAL_CONFIG.URLS.GET_RESOURSE_VISIBILITY,
			{ mapGuid, userGuid: guid }
		);

		if (resources) {
			if (this.economies[guid]) {
				this.economies[guid].setResources(resources.sources);
			}
		}
	}

	async getVisibility(map, guid, mapGuid) {
		const visibility = await this.sendToMap(GLOBAL_CONFIG.URLS.GET_VISIBILITY, { mapGuid, userGuid: guid });
		
		if (visibility && visibility.data) {
			if (this.economies[guid]) {
				this.economies[guid].setVisibility(visibility.data);
			}
		}
	}

	updateBuildings(guids, buildings = []) {
		if (buildings.length === 0) return;
		this.sendToMap(GLOBAL_CONFIG.URLS.UPDATE_BUILDINGS, {
			mapGuid: guids.mapGuid,
			userGuid: guids.peopleEconomy,
			entities: buildings,
		});
	}

	updateUnits(guids, units = []) {
		if (units.length === 0) return;
		this.sendToMap(GLOBAL_CONFIG.URLS.UPDATE_UNITS, {
			mapGuid: guids.mapGuid,
			userGuid: guids.peopleEconomy,
			entities: units,
		});
	}

	spawnArmyUnit(data) { //data = {type, x, y, armyGuid}
		this.sendToPeopleArmy(GLOBAL_CONFIG.URLS.CREATE_UNIT, data);
	}

	/* SOCKETS */
}

module.exports = GameManager;