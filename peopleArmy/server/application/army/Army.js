const CONFIG = require("../../config");
const Soldier = require("./entities/Soldier");
const BMP = require("./entities/BMP");
const Sniper = require("./entities/Sniper");
const Partizan = require("./entities/Partizan");

const { INTERVAL } = CONFIG.ARMY;

class Army {
    constructor({ guids = {}, startPoint = null, map = null, buildings = [], unitTypes = {}, mapGuid = null, common, callbacks = {}, guid }) {
        this.guids = {};

        Object.keys(guids).forEach(key => this.guids[key] = guids[key]);

        this.guid = guid;
        this.mapGuid = mapGuid || this.guids.spectator;
        this.common = common;
        this.callbacks = callbacks;
        this.units = []; // наши юниты
        this.towers = []; // наши здания
        this.buildings = buildings; // постройки на карте
        this.enemyUnits = []; // юниты-враги + фейковые здания-мишени
        this.enemyBuildings = []; // здания-враги

        this.unitTypes = unitTypes;

        this._initMap(map);
        this._initUnits(startPoint);

        this.interval = setInterval(() => this.update(), INTERVAL);
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
            units: this.units.map((u) => (typeof u.get === 'function' ? u.get() : u)),
            enemyUnits: this.enemyUnits,
        };
    }

    _initMap(map = null) {
        if (Array.isArray(map)) {
            this.map = map;
            return;
        }

        this.map = Array.from({ length: 50 }, () => Array.from({ length: 50 }, () => null));
    }

    _initUnits(startPoint) {
        const diagonalPositions = [1, 4, 10, 20, 30, 40, 50, 60, 70, 80, 90];
        this.enemyUnits = diagonalPositions.map((position) => ({
            guid: this.common.guid(),
            type: 'sporomet',
            x: position,
            y: position,
            hp: 100,
            maxHp: 100,
            isAlive: true,
            speed: 0,
            attackRange: 0,
        }));

        // FIX 2: координаты здания отдельные от споромётов (не 90,90)
        if (this.guids?.mushroomsEconomy) {
            this.enemyUnits.push({
                guid: 'mushrooms_main_building',
                type: 'building',
                x: 49,
                y: 49,
                hp: 9999,
                maxHp: 9999,
                isAlive: true,
                speed: 0,
                attackRange: 0,
                isBuilding: true,
                economyGuid: this.guids.mushroomsEconomy,
            });
        }

        this.callbacks.update(this.guid, this.get());
    }

    setVisibility({ units = [], buildings = [] } = {}) {
        //this.enemyUnits = Array.isArray(units) ? units : [];
        this.enemyBuildings = Array.isArray(buildings) ? buildings : [];
        this.updated = true;
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
        let unit = null;
        switch (unitType) {
            case 'bmp':
                unit = new BMP(options);
                break;
            case 'soldier':
                unit = new Soldier(options);
                break;
            case 'sniper':
                unit = new Sniper(options);
                break;
            case 'partizan':
                unit = new Partizan(options);
                break;
            default:
                return { ok: false, error: 'UNKNOWN_UNIT_TYPE' };
        }
        unit.type = unitType;
        unit.damage = Number(stats.DAMAGE) || 1;

        this.units.push(unit);
        this.setUnitsTarget();
        console.log('Юнит создан:', unit.get());
        console.log('Армия:', this.units);
        return { ok: true, data: unit.get() };
    }

    /**
     * Нанести урон юниту по его guid.
     * Если hp <= 0 — юнит удаляется из армии.
     */
    unitTakeDamage({ guid, damage }) {
        const unit = this.units.find((u) => u.guid === guid);

        if (!unit) {
            return { ok: false, error: 'UNIT_NOT_FOUND' };
        }

        unit.takeDamage(damage);
        console.log('Юнит получил урон:', unit.guid, 'damage:', damage, 'hp:', unit.hp);

        if (unit.isDead()) {
            this.units = this.units.filter((u) => u.guid !== guid);
            console.log('Юнит уничтожен:', guid);
        }

        this.updated = true;

        return { ok: true, data: { guid: unit.guid, hp: unit.hp } };
    }

    // 1. выстрелить юнитами по врагам
    getTarget(unit) {
        const height = this.map.length;
        // FIX 1: this.map[0]?.length — ширина строки, не длина всего массива
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

        // возвращаем объект {x, y}, не массив
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

    /**
     * Возвращает массив guid юнитов, отсортированный по текущему hp (от меньшего к большему).
     * По умолчанию сортирует enemyUnits.
     * @param {Array<{ guid: string, hp: number, isAlive?: boolean }>} units
     * @returns {string[]}
     */
    sortUnitsByHP(units = this.enemyUnits) {
        if (!Array.isArray(units) || units.length === 0) {
            return [];
        }
        console.log("отсортировали юнитов по hp");
        return units
            .filter((u) =>
                u &&
                typeof u.guid === 'string' &&
                u.isAlive !== false &&
                typeof u.hp === 'number' &&
                u.hp > 0
            )
            .sort((a, b) => a.hp - b.hp)
            .map((u) => u.guid);
    }

    getUnitsInRange(unit, units = this.enemyUnits) {
        if (!unit || !Array.isArray(units)) {
            return [];
        }
        console.log("вычислили юнитов в радиусе");
        const range = Number(unit.range) || 0;
        const rangeSquared = range * range;
        return units.filter((enemy) => {
            if (!enemy || enemy.isAlive === false || typeof enemy.hp !== 'number' || enemy.hp <= 0) {
                return false;
            }
            const dx = Number(enemy.x) - Number(unit.x);
            const dy = Number(enemy.y) - Number(unit.y);
            return (dx * dx + dy * dy) <= rangeSquared;
        });
    }

    async shotUnits() {
        if (!this.units.length || !this.enemyUnits.length) {
            console.log('[shotUnits] нет юнитов или целей', this.units.length, this.enemyUnits.length);
            return;
        }

        if (typeof this.callbacks?.takeDamage !== 'function') {
            console.log('[shotUnits] нет callback takeDamage');
            return;
        }

        const enemyArmyGuid = this.guids?.mushroomsArmy;

        for (const unit of this.units) {
            const allInRange = this.getUnitsInRange(unit, this.enemyUnits);
            console.log(`[shotUnits] юнит (${unit.x},${unit.y}) range=${unit.range} врагов в зоне: ${allInRange.length}`);

            // FIX 3: разделяем здания и юнитов, чтобы тяжёлые юниты не тратились на здания
            const unitsInRange = allInRange.filter(e => !e.isBuilding);
            const buildingsInRange = allInRange.filter(e => e.isBuilding);

            const sortedEnemyGuids = this.sortUnitsByHP(unitsInRange);

            // если есть обычные юниты в радиусе — бьём их
            if (sortedEnemyGuids.length) {
                const isHeavyShooter = unit.type === 'bmp' || unit.type === 'sniper';
                const targetGuid = isHeavyShooter
                    ? sortedEnemyGuids[sortedEnemyGuids.length - 1]
                    : sortedEnemyGuids[0];
                const target = this.enemyUnits.find((enemy) => enemy.guid === targetGuid);

                if (!target) {
                    continue;
                }

                const amount = Number(unit.damage) || 1;
                console.log("бьем грибочков", amount);
                await this.callbacks.takeDamage({
                    armyGuid: enemyArmyGuid,
                    unitGuid: targetGuid,
                    amount,
                });
                continue;
            }

            // если обычных юнитов нет, но есть здание — бьём здание
            if (buildingsInRange.length) {
                if (typeof this.callbacks?.damageMushroomsEconomy !== 'function') {
                    console.log('[shotUnits] нет callback damageMushroomsEconomy');
                    continue;
                }

                const buildingTarget = buildingsInRange[0];
                const amount = Number(unit.damage) || 1;
                console.log('бьем здание грибочков', amount);
                await this.callbacks.damageMushroomsEconomy({
                    guid: buildingTarget.guid,
                    damage: amount,
                    economyGuid: buildingTarget.economyGuid,
                });
            }
        }
    }

    // 2. сходить юнитами
    moveUnits() {
        this.units.forEach((unit) => {
            if (unit.move(this.map, this.buildings, this.units, this.enemyUnits, this.enemyBuildings)) {
                this.updated = true;
            }
        });
    }

    async update() {
        // 1. выстрелить юнитами по врагам
        await this.shotUnits();
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