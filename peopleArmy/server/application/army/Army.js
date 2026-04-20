const CONFIG = require("../../config");
const Soldier = require("./entities/Soldier");
const BMP = require("./entities/BMP");

const { INTERVAL } = CONFIG.ARMY;

class Army {
    constructor({ map, buildings, common, callbacks = {}, guid, db }) {
        this.guid = guid;
        this.common = common;
        this.callbacks = callbacks;

        this.map = map;

        this.units = []; // наши юниты
        this.towers = []; // наши здания
        this.buildings = buildings; // постройки на карте
        this.enemyUnits = []; // юниты-врагм
        this.enemyBuildings = []; // здания-враги

        this.unitTypes = {};
        db.getUnitTypes().then(types => { this.unitTypes = types; });

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
        const stats = this.unitTypes[unitType];
        if (!stats) {
            return { ok: false, error: 'UNKNOWN_UNIT_TYPE' };
        }

        const guid = this.common.guid();
        const options = { guid, x, y, ...stats };
        const unit = unitType === 'bmp' ? new BMP(options) : new Soldier(options);

        this.units.push(unit);
        this.setUnitsTarget();
        console.log('Юнит создан:', unit.get());
        console.log('Армия:', this.units);
        return { ok: true, data: unit.get() };
    }

    // 1. выстрелить юнитами по врагам
    getTarget(unit) {
        const height = this.map.length;
        const width = this.map[0]?.length || 0;

        if (!height || !width) {
            return null;
        }

        const cells = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (this.map[y][x] !== 0) {
                    continue;
                }

                if (unit.x === x && unit.y === y) {
                    continue;
                }

                cells.push({ x, y });
            }
        }

        if (!cells.length) {
            return null;
        }

        const compareByDistance = (a, b) => {
            const aDx = Math.abs(a.x - unit.x);
            const aDy = Math.abs(a.y - unit.y);
            const bDx = Math.abs(b.x - unit.x);
            const bDy = Math.abs(b.y - unit.y);

            const aDiagonalDistance = Math.min(aDx, aDy);
            const bDiagonalDistance = Math.min(bDx, bDy);

            if (aDiagonalDistance !== bDiagonalDistance) {
                return bDiagonalDistance - aDiagonalDistance;
            }

            const aDistance = (aDx * aDx) + (aDy * aDy);
            const bDistance = (bDx * bDx) + (bDy * bDy);

            if (aDistance !== bDistance) {
                return bDistance - aDistance;
            }

            if (a.y !== b.y) {
                return b.y - a.y;
            }

            return b.x - a.x;
        };

        const diagonalCells = cells.filter((cell) => cell.x !== unit.x && cell.y !== unit.y);
        const targetCells = diagonalCells.length ? diagonalCells : cells;

        return targetCells.sort(compareByDistance)[0];
    }

    setUnitsTarget() {
        this.units.forEach((unit) => {
            if (unit.targetX != null && unit.targetY != null) {
                return;
            }

            const target = this.getTarget(unit);
            if (!target) {
                return;
            }

            unit.setTarget(target.x, target.y);
            this.updated = true;
        });
    }

    shotUnits() {
        //...
    }

    // 2. сходить юнитами
    moveUnits() {
        this.units.forEach((unit) => {
            if (unit.move(this.map, this.buildings, this.units, this.enemyUnits, this.enemyBuildings)) {
                this.updated = true;
                //console.log('Координаты юнита (guid: ', unit.guid, '): ', unit.x, unit.y);
            }
        });
    }

    update() {
        // 1. выстрелить юнитами по врагам
        this.shotUnits();
        this.setUnitsTarget();
        // 2. сходить юнитами
        this.moveUnits();

        if (this.updated) {
            this.updated = false;
            this.callbacks.update(this.guid, this.get());
        }
    }
}

module.exports = Army;
