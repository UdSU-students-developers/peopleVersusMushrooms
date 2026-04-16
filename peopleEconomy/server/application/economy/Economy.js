const EasyStar = require('easystarjs');
const CONFIG = require('../../config');

const { INTERVAL } = CONFIG.ECONOMY.INTERVAL

class Economy {
    constructor(db, common, callbacks, map, guid) {
        this.easyStar = new EasyStar.js();
        this.guid = guid;
        this.map = map;
        this.db = db;
        this.common = common;
        this.callbacks = callbacks;

        this.resourceMap; // массив известных ресурсов
        this.buildings = [];
        this.workers = []; 

        this.enemyBuildings = []; // данные для врагов

        // start game proccess
        this.updated = false;
        this.interval = setInterval(() => this.update(), INTERVAL);
    }

    destructor() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    get() {
        return {
            guid: this.guid,
            buildings: Object.values(this.buildings).map(b => b.get()),
            map: this.map,
        }
    }

    //создать юнита 
    createUnit(x, y, type) {
        //а надо ли? ну типо откуда же воркер должен взяться? а про остальные юниты?
    }

    //движение юнитов
    moveUnits() {
        [...this.workers].forEach(unit => unit.moveOneStep())
    }

    //создание трубопровода
    addPipeline(startX, startY, endX, endY) {
        const pipelineGuid = this.common.guid();
        this.buildings.push(new Pipeline({
            startX,
            startY,
            endX,
            endY,
            map: this.map,
            guid: pipelineGuid,
            economy: this
        }));
        this.updated = true;
    }

    //перемещение ресурсов
    transferResources(pipelineGuid, resource) {
        const pipeline = this.buildings.find(b => b.guid === pipelineGuid);
        if (pipeline) {
            pipeline.transferResources(resource);
        }
    }

    update() {
        //переместить юнитов
        this.moveUnits();

        if (this.updated) {
            this.updated = false;
            this.callbacks.updated(this.get());
        }
    }
    
}

module.exports = Economy;