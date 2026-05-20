const GLOBAL_CONFIG = require("../../../../global/globalConfig");
const Soldier = require("./entities/Soldier");
const BMP = require("./entities/BMP");
const Sniper = require("./entities/Sniper");
const Partizan = require("./entities/Partizan");

const { INTERVAL } = GLOBAL_CONFIG;

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
        this.enemyUnits = []; // юниты-враги
        this.enemyBuildings = []; // здания-враги

        this.unitTypes = unitTypes;

        this._initMap(map);
        this._initUnits();

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

    _initUnits() {
        this.enemyUnits = [];
    }

    setVisibility({ units = [], buildings = [] } = {}) {
        this.enemyUnits = Array.isArray(units) ? units : [];
        this.enemyBuildings = Array.isArray(buildings) ? buildings : [];
        this.updated = true;
    }

    // Возвращает все цели: здания и юниты, помеченные targetKind
    getShootableTargets() {
        const buildings = this.enemyBuildings
            .filter((b) => b && typeof b.guid === 'string')
            .map((b) => ({
                ...b,
                hp: Number.isFinite(Number(b.hp)) ? Number(b.hp) : 1,
                targetKind: 'building',
            }));
        const units = this.enemyUnits.map((u) => ({ ...u, targetKind: 'unit' }));
        return { units, buildings };
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
        unit.maxHp = unit.hp;
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

    getTargetDistanceSquared(unit, target) {
        const unitX = Number(unit.x);
        const unitY = Number(unit.y);
        const targetX = Number(target.x);
        const targetY = Number(target.y);
        const size = Math.max(0, Number(target.size) || 0);
        const maxX = targetX + size;
        const maxY = targetY + size;

        const dx = unitX < targetX ? targetX - unitX : Math.max(0, unitX - maxX);
        const dy = unitY < targetY ? targetY - unitY : Math.max(0, unitY - maxY);

        return (dx * dx) + (dy * dy);
    }

    getUnitsInRange(unit, units = this.enemyUnits) {
        if (!unit || !Array.isArray(units)) {
            return [];
        }
        const range = Number(unit.range) || 0;
        const rangeSquared = range * range;
        return units.filter((enemy) => {
            if (!enemy || enemy.isAlive === false || typeof enemy.hp !== 'number' || enemy.hp <= 0) {
                return false;
            }
            return this.getTargetDistanceSquared(unit, enemy) <= rangeSquared;
        });
    }

    async shotUnits() {
        if (!this.units.length || typeof this.callbacks?.takeDamage !== 'function') {
            return;
        }

        const { units: enemyUnits, buildings: enemyBuildings } = this.getShootableTargets();
        if (!enemyUnits.length && !enemyBuildings.length) {
            return;
        }

        const armyGuid = this.guids?.mushroomsArmy;
        const economyGuid = this.guids?.mushroomsEconomy;
        const prefersBuildings = (type) => type === 'partizan' || type === 'bmp';

        for (const unit of this.units) {
            const unitsInRange = this.getUnitsInRange(unit, enemyUnits);
            const buildingsInRange = this.getUnitsInRange(unit, enemyBuildings);

            // primary/secondary priority зависит от типа юнита
            const [primary, secondary] = prefersBuildings(unit.type)
                ? [buildingsInRange, unitsInRange]
                : [unitsInRange, buildingsInRange];

            const pool = primary.length ? primary : secondary;
            if (!pool.length) {
                continue;
            }

            // всегда бьём наислабейшего в пуле
            const target = pool.reduce((weakest, t) => t.hp < weakest.hp ? t : weakest);

            const amount = Number(unit.damage) || 1;
            await this.callbacks.takeDamage({
                armyGuid,
                economyGuid,
                unitGuid: target.guid,
                amount,
                targetKind: target.targetKind,
            });
        }
    }

    // 2. сходить юнитами (если в радиусе есть враги или вражеские здания — стоим и стреляем)
    moveUnits() {
        const { units: enemyUnits, buildings: enemyBuildings } = this.getShootableTargets();
        this.units.forEach((unit) => {
            const inRange =
                this.getUnitsInRange(unit, enemyUnits).length > 0 ||
                this.getUnitsInRange(unit, enemyBuildings).length > 0;
            if (inRange) {
                unit.path = [];
                unit.walkPoints = 0;
                return;
            }
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
        this.updated = false;
        // 3. обновить видимость и отправить состояние клиенту каждый такт
        this.callbacks.update(this.guid);
    }
}

module.exports = Army;
