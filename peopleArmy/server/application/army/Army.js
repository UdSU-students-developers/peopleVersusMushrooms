const CONFIG = require("../../config");
const Soldier = require("./entities/Soldier");
const BMP = require("./entities/BMP");

const { INTERVAL } = CONFIG.ARMY;

class Army {
    constructor({ map, buildings, common, callbacks = {}, guid }) {
        this.guid = guid;
        this.common = common;
        this.callbacks = callbacks;

        this.map = map;

        this.units = []; // наши юниты
        this.towers = []; // наши здания
        this.buildings = buildings; // постройки на карте
        this.enemyUnits = []; // юниты-врагм
        this.enemyBuildings = []; // здания-враги

        this.interval = setInterval(() => this.update(), INTERVAL); // интервал обновления игры

        this.updated = false;
    }

    destructor() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    get() {
        return {
            units: this.units,
            //...
        }
    }

    /**
     * Создать юнита в этой армии.
     * guid юнита генерируется внутри через Common.
     * @param {{ x: number, y: number, type?: string }} data
     * @returns {{ ok: true, data: object } | { ok: false, error: string }}
     */
    createUnit({ x, y, type = 'soldier' }) {
        const unitType = String(type).toLowerCase();
        const guid = this.common.guid();

        const options = { guid, x, y };
        const unit = unitType === 'bmp' ? new BMP(options) : new Soldier(options);

        this.units.push(unit);
        console.log('Юнит создан:', unit.get());
        console.log('Армия:', this.units);
        return { ok: true, data: unit.get() };
    }

    // 1. выстрелить юнитами по врагам
    shotUnits() {
        //...
    }

    // 2. сходить юнитами
    moveUnits() {
        this.units.forEach((unit) => {
            if (unit.move(this.map, this.buildings, this.units, this.enemyUnits, this.enemyBuildings)) {
                this.updated = true;
                console.log('Координаты юнита (guid: ', unit.guid, '): ', unit.x, unit.y);
            }
        });
    }

    update() {
        // 1. выстрелить юнитами по врагам
        this.shotUnits();
        // 2. сходить юнитами
        this.moveUnits();

        if (this.updated) {
            this.updated = false;
            this.callbacks.update(this.guid, this.get());
        }
    }
}

module.exports = Army;