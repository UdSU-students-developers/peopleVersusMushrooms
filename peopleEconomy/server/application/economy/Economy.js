const EasyStar = require('easystarjs');
const CONFIG = require('../../config');


class Economy {
    constructor(map, db, common) {
        this.easyStar = new EasyStar.js();
        this.map = map;
        this.db = db;
        this.common = common;
        this.buildings = [];
        this.workers = []; 
    }

    get() {

    }

    //создать юнита
    createUnit(x, y, type) {

    }

    //уничтожить здание
    destroyBuilding(guid) {
        //это делает экономика или воркер лично?
    }

    update() {

    }
    
}

module.exports = Economy;