const EasyStar = require('easystarjs');
const CONFIG = require('../../config');

const Mycelium = require('./entities/Mycelium');

const { INTERVAL } = CONFIG.ECONOMY;

class Economy {
    constructor({ db, common, callbacks: { updated }, map, guid }) {
        this.easyStar = new EasyStar.js();
        this.easyStar.disableDiagonals();
        
        this.guid = guid; // совпадает с guid игрока
        this.db = db;
        this.common = common;
        this.callbacks = { updated };
        // данные экономики
        this.resourceMap; // массив известных ресурсов [{x, y, value}]
        this.buildings = []; // здания
        this.mycelium = []; // грибница
        this.workers = []; // рабочие
        this.larvae = []; // массив личинок
        // данные про врагов
        this.enemyBuildings = [];
        //...

        /* УДОЛИ МЕНЯ */
        this.n = 50;
        this.m = 50;
        this.mapInit(map);
        this.addMycelium(50, 49);
        /**************/

        // start game proccess
        this.updated = false;
        this.interval = setInterval(() => this.update(), INTERVAL);
    }


    // TEMPORARY
    mapInit(map) { //Временный метод для заглушки
        if (map) {
            this.map = map;
        } else {
            console.log('Карта не передана при создании экономики! Используется заглушка!');
            this.map = [];
            for (let i = 0; i < 50; i++) {
                this.map.push([]);
                for (let j = 0; j < 50; j++) {
                    this.map[i][j] = 0;
                }
            }

            this.map[39][25] = 1;
            this.map[40][25] = 1;
            this.map[41][25] = 1;
            this.map[42][25] = 1;
            this.map[43][25] = 1;
            this.map[44][25] = 1;
            this.map[45][25] = 1;
            this.map[46][25] = 1;
            this.map[47][25] = 1;
            this.map[48][25] = 1;
            this.map[49][25] = 1;
            this.map[5][25] = 1;
        }
    }


    addMycelium(x, y) {
        this.mycelium.push(new Mycelium({
            x,
            y,
            guid: this.common.guid(),
        }));
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
            mushrooms: this.mycelium.map(m => m.get()),
            map: this.map,
        }
    }

    // 1. вырасти грибочки
    myceliumGrow(mycelium) {
        if (mycelium.update()) {
            this.updated = true;
        }
    }

    // 2. расширить грибницу при возможности
    myceliumExtend(mycelium) {
        if (mycelium.canExtend(this.map, this.mycelium, this.buildings, this.enemyBuildings)) {
            const result = mycelium.extend();
            if (result === null) {
                return;
            }
            this.addMycelium(result.x, result.y);
            this.updated = true;
        }
    }

    setPathsUnits({x, y}) {
        [...this.workers].forEach(unit => unit.calcPath({x, y}));
    }

    moveUnits(){
        [...this.workers].forEach(unit => unit.moveOneStep())
    }


    update() {
        /****************/
        /* про грибницу */
        // 1. вырасти грибочки
        this.mycelium.forEach(mycelium => this.myceliumGrow(mycelium));
        // 2. расширить грибницу при возможности
        this.mycelium.forEach(mycelium => this.myceliumExtend(mycelium));
        // 3. Переместить юнитов если нужно
        this.moveUnits();
        /****************/


        if (this.updated) {
            this.updated = false;
            this.callbacks.updated(this.get());
        }
    }

}

module.exports = Economy;