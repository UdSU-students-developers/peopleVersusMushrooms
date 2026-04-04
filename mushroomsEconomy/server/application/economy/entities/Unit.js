class Unit {
    constructor({ x, y, guid, map, easystar }) {
        this.x = x;
        this.y = y;
        this.guid = guid;
        this.easystar = easystar;
        this.map = map;           // динамическая карта (обновляется извне)
        this.hp = 1;
        this.speed = 1;
        this.isMoving = false;
        this.path = [];
    }

    get() {
        return {
            x: this.x,
            y: this.y,
            hp: this.hp,
            guid: this.guid
        };
    }

    calcPath({ x, y }) {

        this.path = null;
        this.isMoving = false;

        if (this.easystar.setGrid) this.easystar.setGrid(this.map);

        this.easystar.findPath(this.x, this.y, x, y, (path) => {
            if (path) {
                this.path = path;
                this.isMoving = true;
            } else {
                this.path = null;
            }
        });
        this.easystar.calculate();
    }

    moveOneStep() {
        if (!this.isMoving) return false;
        if (!this.path || this.path.length === 0) {
            this.isMoving = false;
            return false;
        }

        // беерем следующую клетку (первая клетка в пути - это обычно текущая позиция)
        // или берем следующую после текущей
        let nextStep = this.path[0];

        // если первая клетка - это текущая позиция, берем вторую
        if (nextStep.x === this.x && nextStep.y === this.y) {
            this.path.shift();
            nextStep = this.path[0];
        }

        if (!nextStep) {
            this.isMoving = false;
            return false;
        }

        // перемещаем юнита в следующую клетку
        this.x = nextStep.x;
        this.y = nextStep.y;

        // удаляем пройденную клетку из пути
        this.path.shift();

        // если путь закончился, останавливаем движение
        if (this.path.length === 0) {
            this.isMoving = false;
        }

        return true;
    }

}

module.exports = Unit;