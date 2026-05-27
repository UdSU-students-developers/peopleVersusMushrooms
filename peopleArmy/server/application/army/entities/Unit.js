const EasyStar = require("easystarjs");
const { buildPathGrid, isWalkable } = require("../pathGrid");

// Количество накопленных очков ходьбы, необходимых для одного шага
const WALK_POINTS_PER_STEP = 5;

class Unit {
    constructor({ guid, x, y, shotCooldown, shotCooldownJitter } = {}) {
        this.guid = guid;
        this.x = x;
        this.y = y;

        this.easyStar = new EasyStar.js();
        this.easyStar.setAcceptableTiles([0]);
        this.easyStar.enableSync();

        this.hp = 1; // здоровье юнита
        this.maxHp = 1; // максимальное здоровье (будет задано снаружи после конструктора)
        this.type = 'unknown'; // тип юнита (будет задан снаружи после конструктора)
        this.speed = 1; // скорость юнита
        this.range = 2; // дальность стрельбы
        this.visible = 3; // дальность видимости

        this.targetX = null;
        this.targetY = null;
        /** Оставшиеся клетки маршрута; path[0] — следующий шаг */
        this.path = [];
        // Накопленные очки ходьбы
        this.walkPoints = 0;

        this.shotCooldown = shotCooldown ?? 2;
        this.shotCooldownJitter = shotCooldownJitter ?? Math.random() * 0.35;
        this.lastShotTime = -999;
        this.formationSlot = null;
        this.moveGoal = null;
        this.tacticalTarget = null;
        this.tacticalAim = null;
        this.tacticalRetreat = null;
    }

    // Задать цель движения юнита
    setTarget(tx, ty) {
        this.targetX = tx;
        this.targetY = ty;
        this.path = [];
    }

    // Очистить цель движения юнита
    clearTarget() {
        this.targetX = null;
        this.targetY = null;
        this.path = [];
    }

    // Нанести урон юниту
    takeDamage(damage) {
        this.hp -= damage;
    }

    // Проверка, мёртв ли юнит
    isDead() {
        return this.hp <= 0;
    }

    // Получить информацию о юните
    get() {
        return {
            guid: this.guid,
            type: this.type,
            x: this.x,
            y: this.y,
            hp: this.hp,
            maxHp: this.maxHp,
            speed: this.speed,
            range: this.range,
            visible: this.visible,
            targetX: this.targetX,
            targetY: this.targetY,
        };
    }

    /**
     * Каждый такт накапливает очки ходьбы (this.speed за такт).
     * При накоплении WALK_POINTS_PER_STEP делает один шаг и вычитает порог.
     */
    move(map, alliedBuildings = []) {
        this.calculateUnitPath(map, alliedBuildings);

        this.walkPoints += this.speed;

        if (this.walkPoints < WALK_POINTS_PER_STEP || this.path.length === 0) {
            return false;
        }

        this.walkPoints -= WALK_POINTS_PER_STEP;

        const grid = buildPathGrid(map, alliedBuildings);
        const next = this.path[0];

        if (!isWalkable(grid, next.x, next.y)) {
            this.path = [];
            this.calculateUnitPath(map, alliedBuildings);
            return false;
        }

        this.x = next.x;
        this.y = next.y;
        this.path.shift();

        return true;
    }

    /**
     * Путь от текущей клетки до цели. grid — уже с учётом рельефа и зданий peopleEconomy.
     */
    findPath(grid) {
        this.easyStar.setGrid(grid);
        let result;
        let calculated = false;
        try {
            this.easyStar.findPath(
                this.x, this.y,
                this.targetX, this.targetY,
                (path) => {
                    result = path;
                    calculated = true;
                });
        } catch {
            return null;
        }
        if (calculated) {
            return result;
        }
        const limit = grid.length * grid.length * 4;
        for (let i = 0; i < limit && !calculated; i++) {
            this.easyStar.calculate();
        }
        return calculated ? result : null;
    }

    /**
     * Построить или обновить маршрут к цели.
     * Если следующий шаг занят зданием — пересчитать путь.
     */
    calculateUnitPath(map, alliedBuildings = []) {
        if (this.targetX == null || this.targetY == null) {
            return;
        }

        const grid = buildPathGrid(map, alliedBuildings);

        if (this.path.length > 0 && isWalkable(grid, this.path[0].x, this.path[0].y)) {
            return;
        }

        const startX = Math.floor(this.x);
        const startY = Math.floor(this.y);
        const endX = Math.floor(this.targetX);
        const endY = Math.floor(this.targetY);

        if (startX === endX && startY === endY) {
            this.path = [];
            return;
        }

        this.path = [];
        const route = this.findPath(grid);
        if (route === null || route.length < 2) {
            // Цель сохраняем — пересчитаем путь на следующих тиках (здания/толпа).
            return;
        }
        this.path = route.slice(1);
    }
}

module.exports = Unit;
