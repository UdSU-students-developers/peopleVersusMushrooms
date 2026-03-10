const EasyStar = require('easystarjs');
const CONFIG = require('../../config');

const { INTERVAL } = CONFIG.ECONOMY;

class Economy {
    constructor({ db, common, callbacks: { }, map, guid }) {
        this.easyStar = new EasyStar.js();

        this.guid = guid; // совпадает с guid игрока
        this.db = db;
        this.common = common;
        this.callbacks = this.callbacks;

        this.mapInit(map);

        this.resourceMap; // массив известных ресурсов [{x, y, value}]
        this.buildings = []; // здания
        this.mycelium = []; // грибница
        this.workers = []; // рабочие
        this.larvae = []; // массив личинок

        // данные про врагов

        // start game proccess
        this.interval = setInterval(() => this.update(), INTERVAL);
    }

    mapInit(map) { //Временный метод для заглушки
        if (map) {
            this.map = map;
        } else {
            console.log('Карта не передана при создании экономики! Используется заглушка!');
            
        }
    }

    destructor() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    get() {

    }

    update() {
        this.mycelium.forEach(mycelium => mycelium.update());
        //...
    }
}

module.exports = Economy;