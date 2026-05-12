const EasyStar = require('easystarjs');

class Unit {
    constructor({ x, y, guid, map, type, visibility, speed = 0.3 }) {
        this.guid = guid;
        this.type = type;
        this.visibility = visibility;

        this.x = x;
        this.y = y;

        this.targetX = x;
        this.targetY = y;

        this.path = [];

        this.hp = 1;

        this.speed = speed;
        this.momentum = 0;

        this.grid = map || null;

        this.easyStar = new EasyStar.js();
        this.easyStar.setAcceptableTiles([0]);
        this.easyStar.enableSync();

        if (this.grid) {
            this.easyStar.setGrid(this.grid);
        }
    }


    get() {
        return {
            guid: this.guid,
            x: this.x,
            y: this.y,
            type: this.type,
            visibility: this.visibility,
        };
    }

    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
        this._recalculatePath();
    }

    setGrid(grid) {
        this.grid = grid;
        this.easyStar.setGrid(grid);

    }

    takeDamage(amount) {
        if (amount <= 0) return false;
        this.hp = Math.max(0, this.hp - amount);
        return this.hp === 0;
    }


    update() {
        if (this._hasReachedTarget()) return;

        this.momentum += this.speed;

        if (this.momentum >= 1.0) {
            this.momentum -= 1.0;
            this._tryStep();
        }
    }


    _hasReachedTarget() {
        return this.x === this.targetX && this.y === this.targetY;
    }

    _tryStep() {
        if (this.path.length === 0) return;

        const next = this.path[0];

        if (this._isCellWalkable(next.x, next.y)) {
            this.x = next.x;
            this.y = next.y;
            this.path.shift();
        } else {
            this._recalculatePath();
        }
    }

    _recalculatePath() {
        if (!this.grid) return;
        if (this._hasReachedTarget()) return;

        this.path = [];

        this.easyStar.findPath(
            this.x, this.y,
            this.targetX, this.targetY,
            (foundPath) => {
                this.path = foundPath ? foundPath.slice(1) : [];
            }
        );

        this.easyStar.calculate();
    }

    _isCellWalkable(x, y) {
        return this.grid?.[y]?.[x] === 0;
    }
}

module.exports = Unit;