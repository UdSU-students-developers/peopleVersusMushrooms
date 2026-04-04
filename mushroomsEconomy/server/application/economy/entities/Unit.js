class Unit {
    constructor({ x, y, guid, map, easystar, hp, speed }) {
        this.x = x;
        this.y = y;
        this.guid = guid;
        this.easystar = easystar;
        this.map = map;           // динамическая карта (обновляется извне)
        this.hp = hp;
        this.speed = speed;
        this.isMoving = false;
        this.path = [];
        this.inertia = 0;
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

        this.inertia += this.speed;

        if (this.inertia < 1) {
            return false;
        }

        this.inertia -= 1;

        let nextStep = this.path[0];
        if (nextStep.x === this.x && nextStep.y === this.y) {
            this.path.shift();
            nextStep = this.path[0];
        }

        if (!nextStep) {
            this.isMoving = false;
            return false;
        }

        // перемещаем юнита
        this.x = nextStep.x;
        this.y = nextStep.y;
        this.path.shift();

        if (this.path.length === 0) {
            this.isMoving = false;
        }

        return true
    }

}

module.exports = Unit;