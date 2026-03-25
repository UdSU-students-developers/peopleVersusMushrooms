const CONFIG = require("../../config");
const EasyStar = require("easystarjs");

const { INTERVAL } = CONFIG.ARMY;

class Army {
    constructor({ map, buildings, common, callbacks = {}, guid }) {
        this.guid = guid;
        this.common = common;
        this.callbacks = callbacks;

        this.n = 50;
        this.m = 50;
        this.mapInit(map);

        this.easyStar = new EasyStar.js();
        this.easyStar.setAcceptableTiles([0]);
        this.easyStar.enableSync();
        this.easyStar.setGrid(this.map);

        this.units = []; // наши юниты
        this.towers = []; // наши здания
        this.buildings = buildings; // постройки на карте
        this.enemyUnits = []; // юниты-врагм
        this.enemyBuildings = []; // здания-враги

        this.interval = setInterval(() => this.update(), INTERVAL); // интервал обновления игры
    }

    /** Обновить сетку у EasyStar после изменений this.map (препятствия и т.д.) */
    updateMap() {
        this.easyStar.setGrid(this.map);
    }

    /**
     * Путь от (x0,y0) до (x1,y1). Координаты как в карте: map[y][x].
     * @returns {Array<{x:number,y:number}>|null} цепочка клеток от старта до цели, или null если пути нет
     */
    findPath(x0, y0, x1, y1) {
        this.updateMap();
        let result;
        let calculated = false;
        try {
            this.easyStar.findPath(x0, y0, x1, y1, (path) => {
                result = path;
                calculated = true;
            });
        } catch {
            return null;
        }
        if (calculated) {
            return result;
        }
        const limit = this.n * this.m * 4;
        for (let i = 0; i < limit && !calculated; i++) {
            this.easyStar.calculate();
        }
        return calculated ? result : null;
    }

    /** Если у юнита есть цель, но ещё нет waypoints — считаем путь здесь. */
    calculateUnitPath(unit) {
        if (unit.targetX == null || unit.targetY == null) {
            return;
        }
        if (unit.path.length > 0) {
            return;
        }
        const p = this.findPath(unit.x, unit.y, unit.targetX, unit.targetY);
        if (p === null || p.length < 2) {
            unit.clearTarget();
            return;
        }
        // еслии у юнита есть цель, срезаем первый элемент массива path, т.к. он уже был достигнут
        unit.path = p.slice(1);
    }

    mapInit(map) { // Временный метод для заглушки
        if (map) {
            console.log('Карта передана при создании армии! Используется переданная карта!');
            this.map = map;
        } else {
            console.log('Карта не передана при создании армии! Используется заглушка!');
            this.map = Array(this.n).fill().map(() => Array(this.m).fill(0));
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

            this.printMap();
        }
    }

    printMap() {
        console.clear();
        console.log(`\n===========================`);
        this.map.forEach(row => {
            console.log(row.join(' '));
        });
        console.log('===========================\n');
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
        this.units.forEach((unit) => {
            this.calculateUnitPath(unit);
            unit.move(this.map);
            console.log('Координаты юнита (guid: ', unit.guid, '): ', unit.x, unit.y);
        });
        // this.printMap();
    }
}

module.exports = Army;
