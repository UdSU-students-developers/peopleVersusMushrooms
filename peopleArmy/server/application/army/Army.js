const CONFIG = require("../../config");

const { INTERVAL } = CONFIG.ARMY;

class Army {
    constructor({ map, buildings, common, callbacks = {} }) {
        this.map = map; // [[1,0,0],[0,0,1],[1,1,0]]
        this.units = []; // наши юниты
        this.towers = []; // наши здания

        this.buildings = buildings; // постройки на карте
        this.enemyUnits = []; // юниты-врагм
        this.enemyBuildings = []; // здания-враги

        this.interval = setInterval(() => this.update(), INTERVAL); // интервал обновления игры
    }

    destructor() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    update() {
        // выстрелить юнитами по врагам
        //..
        // передвинуть юнитов
        this.units.forEach(unit => unit.move(this.map));
    }
}

module.exports = Army;