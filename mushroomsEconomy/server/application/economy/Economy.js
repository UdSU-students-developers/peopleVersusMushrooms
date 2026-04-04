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
        this.map = map;
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
        this.addMycelium(50, 49);
        /**************/

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
            mushrooms: this.mycelium.map(m => m.get()),
            map: this.map,
        }
    }

    addMycelium(x, y) {
        this.mycelium.push(new Mycelium({
            x,
            y,
            guid: this.common.guid(),
        }));
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

    setPathsUnits({ x, y }) {
        [...this.workers].forEach(unit => unit.calcPath({ x, y }));
    }

    moveUnits() {
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