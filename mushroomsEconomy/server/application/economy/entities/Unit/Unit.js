const EasyStar = require('easystarjs');

class Unit {
    constructor({ x, y, guid, map, type, visibility, speed = 0.3 }) {
        this.guid = guid;
        this.type = type;
        this.visibility = visibility;
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

    findNearestCell() {
        const cells = [];
        const currentX = Math.floor(this.x);
        const currentY = Math.floor(this.y);

        const directions = [
            [0, 1], [0, -1], [1, 0], [-1, 0]
        ];

        const occupiedCells = [];

        if (this.visibility.buildings) {
            for (let i = 0; i < this.visibility.length; i++) {
                const building = this.visibility.building[i];
                const x = Math.floor(building.x);
                const y = Math.floor(building.y);
                occupiedCells.push({ x: x, y: y});
            }
        }

        for (const [dx, dy] of directions) {
            const newX = currentX + dx;
            const newY = currentY + dy;

            if (this.grid[newY] && this.grid[newY][newX] !== undefined) {
                let isOccupied = false;
                for (let i = 0; i < occupiedCells.length; i++) {
                    if (occupiedCells[i].x === newX && occupiedCells[i].y) {
                       isOccupied = true;
                       break; 
                    }
                }

                if (!isOccupied) cells.push({ x: newX, y: newY });
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
        if (this.grid?.[y]?.[x] !== 0) {
            return false;
        }

        for (const unit of this.units) {
            if (unit.guid === this.guid) continue;

            if (unit.x === x && unit.y === y) {
                return false;
            }
        }

        return true;
    }
}

module.exports = Unit;