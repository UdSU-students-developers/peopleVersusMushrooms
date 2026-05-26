const EasyStar = require('easystarjs');

const DIRECTIONS = [
    [0, 1], [0, -1], [1, 0], [-1, 0]
];

class Unit {
    constructor({ x, y, guid, map, type, visibility, speed = 0.3, sourcesVisibility }) {
        this.guid = guid;
        this.type = type;
        this.visibility = visibility;
        this.sourcesVisibility = sourcesVisibility;
        this.units = [];

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
            sourcesVisibility: this.sourcesVisibility,
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
        this.hp = Math.max(0, this.hp - amount);
        return this.hp <= 0;
    }

    findNearestCell() {
        const currentX = Math.floor(this.x);
        const currentY = Math.floor(this.y);

        const occupiedCells = new Set();

        if (this.visibility.buildings.length) {
            for (const building of this.visibility.buildings) {
                occupiedCells.add(`${Math.floor(building.x)},${Math.floor(building.y)}`);
            }
        }

        const cells = [];

        for (const [dx, dy] of DIRECTIONS) {
            const nx = currentX + dx;
            const ny = currentY + dy;

            if (this.grid[ny]?.[nx] !== undefined && !occupiedCells.has(`${nx},${ny}`)) {
                cells.push({ x: nx, y: ny });
            }
        }

        return cells;
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

    setUnits(units) {
        this.units = units;
    }

    _isCellWalkable(x, y) {
        if (this.grid?.[y]?.[x] !== 0) return false;

        for (const unit of this.units) {
            if (unit.guid !== this.guid && unit.x === x && unit.y === y) return false;
        }

        return true;
    }
}

module.exports = Unit;