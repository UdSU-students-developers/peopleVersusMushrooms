const GLOBAL_CONFIG = require("../../../../global/globalConfig");
const Soldier = require("./entities/Soldier");
const BMP = require("./entities/BMP");
const Sniper = require("./entities/Sniper");
const Partizan = require("./entities/Partizan");
const TacticalController = require("./tactics/TacticalController");
const { SHOT_COOLDOWN_BY_TYPE } = require("./tactics/constants");

const { INTERVAL } = GLOBAL_CONFIG;
const TICK_DELTA_SEC = INTERVAL / 1000;

const BUILDING_MAX_HP = {
    sporovaya_bashnya: 160,
    vzryvomor: 70,
    mycelium: 1,
    incubator: 100,
    reactor: 60,
    small_reactor: 20,
    mine: 80,
};

/** Здания mushroomsEconomy (урон через POST /damage), не mushroomsArmy */
const MUSHROOMS_ECONOMY_BUILDING_TYPES = new Set([
    'mycelium', 'incubator', 'reactor', 'small_reactor', 'mine',
]);

/** Роли союзников — не цели peopleArmy (юниты и здания с карты) */
const ALLIED_MAP_ROLES = new Set([
    GLOBAL_CONFIG.PEOPLE_ECONOMY.ROLE,
    GLOBAL_CONFIG.PEOPLE_ARMY.ROLE,
]);

/** Нормализация role с карты (map/lobby могли отдавать разные ключи) */
const normalizeMapRole = (role) => {
    if (role === 'mushroomArmy') return GLOBAL_CONFIG.MUSHROOMS_ARMY.ROLE;
    if (role === 'mushroomEconomy') return GLOBAL_CONFIG.MUSHROOMS_ECONOMY.ROLE;
    return role;
};

/** Роли врагов — только их атакуем */
const HOSTILE_MAP_ROLES = new Set([
    GLOBAL_CONFIG.MUSHROOMS_ARMY.ROLE,
    GLOBAL_CONFIG.MUSHROOMS_ECONOMY.ROLE,
    // legacy-ключи map до фикса Map.js
    'mushroomArmy',
    'mushroomEconomy',
]);

/** Fallback по type, если role в ответе карты нет */
const PEOPLE_ECONOMY_BUILDING_TYPES = new Set([
    'pipe',
    'oil_barrel',
    'iron_barrel',
    'barracks',
    'small_reactor',
    'large_reactor',
    'driller',
    'mine',
    'small_generator',
]);

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
        this.enemyBuildings = []; // здания-враги (цели боя)
        this.alliedBuildings = []; // здания peopleEconomy / союзники — только отображение
        this.destroyedEnemyBuildingGuids = new Set(); // уничтожены нами — не показывать даже если карта ещё отдаёт
        /** @type {Map<string, { x: number, y: number, type: string, visibility: number }>} */
        this.mapSyncedUnits = new Map(); // последнее состояние, отданное карте (протокол UPDATE_UNITS)

        this.unitTypes = unitTypes;

        this._initMap(map);
        this._initUnits();

        this.tactics = new TacticalController(this);
        this.interval = setInterval(() => this.update(), INTERVAL); // интервал обновления игры
        this.updated = false;
    }

    /** Остановить игровой цикл (clearInterval). */
    destructor() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    /**
     * Снимок состояния для клиента (UPDATE_ARMY).
     * @returns {{ units, enemyUnits, enemyBuildings, alliedBuildings, destroyedEnemyBuildingGuids }}
     */
    get() {
        return {
            units: this.units.map((u) => (typeof u.get === 'function' ? u.get() : u)),
            enemyUnits: this.enemyUnits,
            enemyBuildings: this.enemyBuildings.filter((b) => Army._isBuildingAlive(b)),
            alliedBuildings: this.alliedBuildings,
            destroyedEnemyBuildingGuids: [...this.destroyedEnemyBuildingGuids],
        };
    }

    /** Союзная сущность с карты (peopleEconomy / peopleArmy) — не атакуем, но показываем. */
    static _isAlliedMapEntity(entity) {
        if (!entity || typeof entity.guid !== 'string') {
            return false;
        }
        const role = normalizeMapRole(entity.role);
        if (role) {
            return ALLIED_MAP_ROLES.has(role);
        }
        return Army._isPeopleEconomyBuildingType(entity.type);
    }

    /**
     * Враждебная сущность с карты (юнит или здание).
     * Союзники: peopleEconomy, peopleArmy. Враги: mushroomsArmy, mushroomsEconomy.
     */
    static _isHostileMapEntity(entity) {
        if (!entity || typeof entity.guid !== 'string') {
            return false;
        }
        const role = normalizeMapRole(entity.role);
        if (role) {
            if (ALLIED_MAP_ROLES.has(role)) {
                return false;
            }
            return HOSTILE_MAP_ROLES.has(role);
        }
        return !Army._isPeopleEconomyBuildingType(entity.type);
    }

    static _isPeopleEconomyBuildingType(type) {
        return PEOPLE_ECONOMY_BUILDING_TYPES.has(String(type || '').toLowerCase());
    }

    static _buildingMaxHp(type) {
        return BUILDING_MAX_HP[String(type || '').toLowerCase()] ?? 100;
    }

    /** HP для выбора цели, если с карты hp не пришёл (неизвестный тип — 1). */
    static _buildingDefaultTargetHp(type) {
        const key = String(type || '').toLowerCase();
        if (Object.prototype.hasOwnProperty.call(BUILDING_MAX_HP, key)) {
            return BUILDING_MAX_HP[key];
        }
        return 1;
    }

    /** Здание обслуживается mushroomsEconomy (POST /damage), не mushroomsArmy. */
    static _isMushroomsEconomyBuilding(entity) {
        const role = normalizeMapRole(entity?.role);
        if (role === GLOBAL_CONFIG.MUSHROOMS_ECONOMY.ROLE) {
            return true;
        }
        if (role === GLOBAL_CONFIG.MUSHROOMS_ARMY.ROLE) {
            return false;
        }
        return MUSHROOMS_ECONOMY_BUILDING_TYPES.has(String(entity?.type || '').toLowerCase());
    }

    static _isDamageApplied(result) {
        return result != null && result !== false;
    }

    static _isBuildingAlive(b) {
        if (!b || typeof b.guid !== 'string') return false;
        if (b.isAlive === false) return false;
        if (typeof b.hp === 'number' && b.hp <= 0) return false;
        return true;
    }

    /** Инициализировать карту проходимости (массив 50×50 по умолчанию). */
    _initMap(map = null) {
        if (Array.isArray(map)) {
            this.map = map;
            return;
        }
    }

    /** Сбросить список вражеских юнитов при старте армии. */
    _initUnits() {
        this.enemyUnits = [];
    }

    /**
     * Дельта для map UPDATE_UNITS (см. map/API.md §4.2.4):
     * — новый guid или смена (x, y) → добавление / перемещение;
     * — guid был на карте, юнита в армии нет → те же coords → удаление.
     * Стоящий живой юнит повторно не отправляется.
     * @returns {{ guid: string, x: number, y: number, type: string, visibility: number }[]}
     */
    buildMapUnitUpdateEntities() {
        const entities = [];
        const aliveGuids = new Set();

        for (const unit of this.units) {
            if (typeof unit.get !== 'function') {
                continue;
            }
            const s = unit.get();
            aliveGuids.add(s.guid);
            const snapshot = {
                guid: s.guid,
                x: s.x,
                y: s.y,
                type: s.type,
                visibility: s.visible,
            };
            const prev = this.mapSyncedUnits.get(s.guid);
            if (!prev || prev.x !== snapshot.x || prev.y !== snapshot.y) {
                entities.push(snapshot);
            }
        }

        for (const [guid, prev] of this.mapSyncedUnits) {
            if (!aliveGuids.has(guid)) {
                entities.push({
                    guid,
                    x: prev.x,
                    y: prev.y,
                    type: prev.type,
                    visibility: prev.visibility,
                });
            }
        }

        for (const entity of entities) {
            if (aliveGuids.has(entity.guid)) {
                this.mapSyncedUnits.set(entity.guid, {
                    x: entity.x,
                    y: entity.y,
                    type: entity.type,
                    visibility: entity.visibility,
                });
            } else {
                this.mapSyncedUnits.delete(entity.guid);
            }
        }

        return entities;
    }

    /**
     * Обновить врагов по ответу map GET_VISIBILITY (ArmyManager.updateArmyCallback).
     * units — полная замена каждый тик. buildings — без guid из destroyedEnemyBuildingGuids; hp с карты нет.
     * @param {{ units?: object[], buildings?: object[] }} params
     */
    setVisibility({ units = [], buildings = [] } = {}) {
        const incomingUnits = Array.isArray(units) ? units : [];
        this.enemyUnits = incomingUnits.filter((u) => Army._isHostileMapEntity(u));

        const prevHpByGuid = new Map(
            this.enemyBuildings.map((b) => [b.guid, b.hp]),
        );
        const incomingBuildings = Array.isArray(buildings) ? buildings : [];
        this.alliedBuildings = incomingBuildings.filter((b) => Army._isAlliedMapEntity(b));
        this.enemyBuildings = incomingBuildings
            .filter((b) => Army._isHostileMapEntity(b))
            .filter((b) => !this.destroyedEnemyBuildingGuids.has(b.guid))
            .map((b) => {
                const trackedHp = prevHpByGuid.get(b.guid);
                if (typeof trackedHp === 'number') {
                    return { ...b, hp: trackedHp };
                }
                return b;
            });

        this.updated = true;
    }

    /**
     * Учесть урон по зданию (локальный hp; карта hp не отдаёт).
     * При hp <= 0 — guid в destroyedEnemyBuildingGuids, здание убираем из enemyBuildings.
     * @param {string} guid
     * @param {string} type
     * @param {number} amount
     */
    /**
     * Учёт урона по зданию после выстрела.
     * @param {object|null} remote — ответ mushroomsArmy /takeDamage: { kind, hp, isAlive }
     */
    _markBuildingDamaged(guid, type, amount, remote = null) {
        const index = this.enemyBuildings.findIndex((b) => b.guid === guid);

        if (remote && remote.kind === 'building') {
            if (remote.isAlive === false || (typeof remote.hp === 'number' && remote.hp <= 0)) {
                this._forceDestroyEnemyBuilding(guid);
                return;
            }
            if (index >= 0) {
                this.enemyBuildings[index] = {
                    ...this.enemyBuildings[index],
                    hp: remote.hp,
                };
                this.updated = true;
            }
            return;
        }

        if (index < 0) {
            return;
        }
        const building = this.enemyBuildings[index];
        const maxHp = Army._buildingMaxHp(type);
        let hp = Number.isFinite(Number(building.hp)) ? Number(building.hp) : maxHp;
        hp -= Number(amount) || 0;

        if (hp <= 0) {
            this._forceDestroyEnemyBuilding(guid);
            return;
        }

        this.enemyBuildings[index] = { ...building, hp };
        this.updated = true;
    }

    /** Здание уничтожено — скрыть у клиента даже если карта ещё отдаёт guid. */
    _forceDestroyEnemyBuilding(guid) {
        this.destroyedEnemyBuildingGuids.add(guid);
        const index = this.enemyBuildings.findIndex((b) => b.guid === guid);
        if (index >= 0) {
            this.enemyBuildings.splice(index, 1);
        }
        this.updated = true;
    }

    _applyBuildingShotResult(guid, type, amount, damageResult) {
        if (damageResult && typeof damageResult === 'object' && damageResult.kind === 'building') {
            this._markBuildingDamaged(guid, type, amount, damageResult);
            return;
        }
        if (Army._isDamageApplied(damageResult)) {
            this._markBuildingDamaged(guid, type, amount);
            return;
        }
        if (type) {
            this._forceDestroyEnemyBuilding(guid);
        }
    }

    /**
     * Economy не знает guid — призрак на карте; перестаём стрелять и скрываем у клиента.
     * @param {string} guid
     */
    _discardGhostEconomyBuilding(guid) {
        this.destroyedEnemyBuildingGuids.add(guid);
        const index = this.enemyBuildings.findIndex((b) => b.guid === guid);
        if (index >= 0) {
            this.enemyBuildings.splice(index, 1);
        }
        this.updated = true;
    }

    /**
     * Собрать цели для стрельбы: юниты и здания с полем targetKind.
     * @returns {{ units: object[], buildings: object[] }}
     */
    getShootableTargets() {
        const buildings = this.enemyBuildings
            .filter((b) => Army._isHostileMapEntity(b))
            .filter((b) => Army._isBuildingAlive(b))
            .map((b) => ({
                ...b,
                hp: Number.isFinite(Number(b.hp)) ? Number(b.hp) : Army._buildingDefaultTargetHp(b.type),
                targetKind: 'building',
            }));
        const units = this.enemyUnits
            .filter((u) => Army._isHostileMapEntity(u))
            .filter((u) => u.isAlive !== false && !(typeof u.hp === 'number' && u.hp <= 0))
            .map((u) => ({ ...u, targetKind: 'unit' }));
        return { units, buildings };
    }

    /**
     * Создать юнит в армии (guid через Common).
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
        unit.shotCooldown = SHOT_COOLDOWN_BY_TYPE[unitType] ?? 2;
        unit.shotCooldownJitter = Math.random() * 0.35;
        unit.lastShotTime = -999;

        this.units.push(unit);
        return { ok: true, data: unit.get() };
    }

    /**
     * Нанести урон своему юниту по guid; при смерти — удалить из units.
     * @param {{ guid: string, damage: number }} params
     * @returns {{ ok: true, data: object } | { ok: false, error: string }}
     */
    unitTakeDamage({ guid, damage }) {
        const unit = this.units.find((u) => u.guid === guid);

        if (!unit) {
            return { ok: false, error: 'UNIT_NOT_FOUND' };
        }

        unit.takeDamage(damage);

        if (unit.isDead()) {
            this.units = this.units.filter((u) => u.guid !== guid);
        }

        this.updated = true;

        return { ok: true, data: { guid: unit.guid, hp: unit.hp } };
    }

    /**
     * Выбрать клетку-цель для марша (свободная клетка, приоритет по диагонали и дистанции).
     * @param {object} unit
     * @returns {{ x: number, y: number } | null}
     */
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

    /** Назначить цель марша юнитам без targetX/targetY. */
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
     * Квадрат дистанции от юнита до цели (для зданий учитывается size).
     * @param {object} unit
     * @param {object} target
     * @returns {number}
     */
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

    /**
     * Отфильтровать цели в радиусе атаки юнита.
     * @param {object} unit
     * @param {object[]} units
     * @returns {object[]}
     */
    getUnitsInRange(unit, units = this.enemyUnits) {
        if (!unit || !Array.isArray(units)) {
            return [];
        }
        const range = Number(unit.range) || 0;
        const rangeSquared = range * range;
        return units.filter((enemy) => {
            if (!enemy || enemy.isAlive === false) {
                return false;
            }
            if (typeof enemy.hp === 'number' && enemy.hp <= 0) {
                return false;
            }
            return this.getTargetDistanceSquared(unit, enemy) <= rangeSquared;
        });
    }

    /**
     * Выстрелить всеми юнитами (utility + LoS + резервирование).
     * Для тестов и явного вызова: сначала пересчёт плана, затем залп.
     */
    async shotUnits() {
        this.tactics.plan();
        await this.tactics.executeCombat(0);
    }

    /** Сдвинуть юнитов по тактическому moveGoal / формации. */
    moveUnits() {
        this.tactics.executeMovement();
    }

    /**
     * Тик игры: тактика (план 400 мс, бой и движение каждые 200 мс) → callbacks.update.
     */
    async update() {
        await this.tactics.tick(TICK_DELTA_SEC);
        this.updated = false;
        this.callbacks.update(this.guid);
    }
}

module.exports = Army;
