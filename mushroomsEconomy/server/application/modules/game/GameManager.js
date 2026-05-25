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
		this.mediator.subscribe(this.EVENTS.DAMAGE, (data) => this.eventApplyDamage(data));
		this.mediator.subscribe(this.EVENTS.MOVE_UNIT, (data) => this.eventMoveUnit(data));
		this.mediator.subscribe(this.REQUEST_UNITS, (data) => this.eventRequestUnits(data));
		this.mediator.subscribe(this.REQUEST_BUILDINGS, (data) => this.eventRequestBuildings(data));
		// mediator triggers setters
		//...
	}

	/* PRIVATE */
	async callbackUpdate(data) {

		const { mapGuid } = data.guids;
		const guid = data.guids.mushroomsEconomy;
		const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
		if (!user) {
			console.log('User отсутствует!, callbackUpdate не работает! \n map guid: ', mapGuid);
			return;
		}

		// Сначала синхронизируем карту, затем видимость (иначе призраки после destroyed)
		await this.updateBuildings(data.guids, this.economies[guid].getUpdatedBuildings());
		await this.updateUnits(data.guids, this.economies[guid].getUpdatedUnits());
		// формате отдавать в сервис карты
		// получить ответ
		// запросить рельеф
		//this.getRelief(data.map, guid, mapGuid);
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
		const { entityGuid, damage, mushroomsEconomy } = data;
		const economy = this.economies[mushroomsEconomy];

		if (!economy) {
			return 4001;
		}

		if (!economy.applyDamage(entityGuid, damage)) {
			return 4003;
		}

		return true;
	}

	eventMoveUnit(data = {}) {
		const { guid, mushroomsEconomy } = data;
		const economy = this.economies[mushroomsEconomy];

		if (!economy) {
			return false;
		}

		return economy.moveUnitToNearestCell(guid);
	}

	eventRequestUnits(data = {}) {
		const { mushroomsEconomy, unitsType, unitsAmount } = data;
		const economy = this.economies[mushroomsEconomy];

		if (!economy) {
			return { error: 4001 };
		}

		economy.autopilot.addUnitRequests(unitsType, unitsAmount);
		return { success: true };
	}

	eventRequestBuildings(data = {}) {
		const { mushroomsEconomy, buildingsType, buildingsAmount } = data;
		const economy = this.economies[mushroomsEconomy];

		if (!economy) {
			return { error: 4001 };
		}

		economy.autopilot.addBuildingRequests(buildingsType, buildingsAmount);
		return { success: true };
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

	async updateBuildings(guids, buildings = []) {
		if (buildings.length === 0) return;
		return this.sendToMap(GLOBAL_CONFIG.URLS.UPDATE_BUILDINGS, {
			mapGuid: guids.mapGuid,
			userGuid: guids.mushroomsEconomy,
			entities: buildings,
		});
	}

	async updateUnits(guids, units = []) {
		if (units.length === 0) return;
		return this.sendToMap(GLOBAL_CONFIG.URLS.UPDATE_UNITS, {
			mapGuid: guids.mapGuid,
			userGuid: guids.mushroomsEconomy,
			entities: units,
		});
	}

	spawnArmyUnit(data) { //data = {unitType, x, y, armyGuid}
		this.sendToMushroomsArmy(GLOBAL_CONFIG.URLS.SPAWN_UNIT, data);
	}


	/* SOCKETS */
}

module.exports = GameManager;