class Unit {
    constructor({ guid, x, y }) {
        this.guid = guid;
        this.x = x;
        this.y = y;

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
    move(map) {
        for (let s = 0; s < this.speed && this.path.length > 0; s++) {
            const next = this.path[0];
            if (map[next.y][next.x] !== 0) {
                this.path = [];
                return;
            }
            this.x = next.x;
            this.y = next.y;
            this.path.shift();
        }
        if (
            this.targetX != null &&
            this.targetY != null &&
            this.x === this.targetX &&
            this.y === this.targetY
        ) {
            this.clearTarget();
        }
    }
}

module.exports = Unit;
