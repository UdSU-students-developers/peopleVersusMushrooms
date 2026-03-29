const EasyStar = require("easystarjs");

class Unit {
    constructor({ guid, x, y }) {
        this.guid = guid;
        this.x = x;
        this.y = y;

        this.easyStar = new EasyStar.js();
        this.easyStar.setAcceptableTiles([0]);
        this.easyStar.enableSync();

        this.hp = 1; // здоровье юнита
        this.speed = 1; // скорость юнита
        this.range = 2; // дальность стрельбы
        this.visible = 3; // дальность видимости

        this.targetX = null;
        this.targetY = null;
        /** Оставшиеся клетки маршрута; path[0] — следующий шаг */
        this.path = [];
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

    // Получить информацию о юните
    get() {
        return {
            guid: this.guid,
            x: this.x,
            y: this.y,
            hp: this.hp,
            speed: this.speed,
            range: this.range,
            visible: this.visible,
            targetX: this.targetX,
            targetY: this.targetY,
        };
    }

    /**
    За 1 вызов не больше this.speed клеток по маршруту
    */
    move(map, buildings, units, enemies, enemyBuildings) {
        this.calculateUnitPath(map, buildings, units, enemies, enemyBuildings)
        for (let s = 0; s < this.speed && this.path.length > 0; s++) {
            const next = this.path[0];
            if (map[next.y][next.x] !== 0) {
                this.path = [];
                console.log('Юнит столкнулся с препятствием');
                return false;
            }
            this.x = next.x;
            this.y = next.y;
            this.path.shift();
            return true;
        }
        /*if (
            this.targetX != null &&
            this.targetY != null &&
            this.x === this.targetX &&
            this.y === this.targetY
        ) {
            this.clearTarget();
        }*/
        return false;
    }

    /** Обновить сетку у EasyStar после изменений this.map (препятствия и т.д.) */
    updateMap(map, buildings, units, enemies, enemyBuildings) {
        this.easyStar.setGrid(map);
    }

    /**
     * Путь от (x0,y0) до (x1,y1). Координаты как в карте: map[y][x].
     * @returns {Array<{x:number,y:number}>|null} цепочка клеток от старта до цели, или null если пути нет
     */
    findPath(map, buildings, units, enemies, enemyBuildings) {
        this.updateMap(map, buildings, units, enemies, enemyBuildings);
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
        const limit = map.length * map.length * 4;
        for (let i = 0; i < limit && !calculated; i++) {
            this.easyStar.calculate();
        }
        return calculated ? result : null;
    }

    /** Если у юнита есть цель, но ещё нет waypoints — считаем путь здесь. */
    calculateUnitPath(map, buildings, units, enemies, enemyBuildings) {
        if (this.targetX == null || this.targetY == null) {
            return;
        }
        if (this.path.length > 0) {
            return;
        }
        const p = this.findPath(map, buildings, units, enemies, enemyBuildings);
        if (p === null || p.length < 2) {
            this.clearTarget();
            return;
        }
        // еслии у юнита есть цель, срезаем первый элемент массива path, т.к. он уже был достигнут
        this.path = p.slice(1);
    }
}

module.exports = Unit;
