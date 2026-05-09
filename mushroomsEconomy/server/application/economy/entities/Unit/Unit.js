const EasyStar = require('easystarjs');
const CONFIG = require("../../../../config");

class Unit {
    constructor({ x, y, guid, map, type, visibility }) {
        this.x = x;
        this.y = y;

        this.targetX = x;
        this.targetY = y;

        this.path = [];
        this.lastTargetX = x;
        this.lastTargetY = y;

        this.guid = guid;
        this.hp = 1;
        this.speed = 3;
        this.type = type; 
        this.visibility = visibility;

        this.map = map;

        this.easyStar = new EasyStar.js();
        this.easyStar.setAcceptableTiles([0]);
        this.easyStar.enableSync();

        this._applyGrid();
        this.pathRequested = false;
        this.pathVersion = 0;
        this.currentPathVersion = 0;
    }

    setMap(map) {
        this.map = map;
        this._applyGrid();
        this.path = [];
    }

    _applyGrid() {
        if (!this.map) return;
        this.easyStar.setGrid(this.map);
    }

    get() {
        return {
            x: Math.floor(this.x),
            y: Math.floor(this.y),
            type: this.type,
            guid: this.guid,
            visibility: this.visibility
        };
    }

    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }

    _isWalkable(x, y) {
        return this.map[y] && this.map[y][x] === 0;
    }

    _findNearestWalkable(targetX, targetY, maxRadius = CONFIG.ECONOMY.UNIT.RADIUS) {
        if (this._isWalkable(targetX, targetY)) {
            return { x: targetX, y: targetY };
        }

        const queue = [{ x: targetX, y: targetY, d: 0 }];
        const visited = new Set([`${targetX},${targetY}`]);

        while (queue.length) {
            const { x, y, d } = queue.shift();
            if (d > maxRadius) break;

            if (this._isWalkable(x, y)) return { x, y };

            const neighbors = [
                [x+1,y],[x-1,y],[x,y+1],[x,y-1]
            ];

            for (const [nx, ny] of neighbors) {
                const key = `${nx},${ny}`;
                if (!visited.has(key) && this.map[ny] && this.map[ny][nx] !== undefined) {
                    visited.add(key);
                    queue.push({ x: nx, y: ny, d: d + 1 });
                }
            }
        }

        return null;
    }

    calculatePath() {
        const endX = Math.round(this.targetX);
        const endY = Math.round(this.targetY);

        const changed =
            endX !== this.lastTargetX ||
            endY !== this.lastTargetY;

        if (!changed && this.path.length > 0) return;

        this.lastTargetX = endX;
        this.lastTargetY = endY;

        this.pathRequested = true;
        const version = ++this.currentPathVersion;

        this.easyStar.findPath(
            Math.floor(this.x),
            Math.floor(this.y),
            endX,
            endY,
            (path) => {
                if (version !== this.currentPathVersion) return;

                this.path = path ? path.slice(1) : [];
                this.pathRequested = false;
            }
        );

        this.easyStar.calculate();
    }

    findNearestCell() {
        const cells = [];
        const currentX = Math.floor(this.x);
        const currentY = Math.floor(this.y);

        const directions = [
            [0, 1], [0, -1], [1, 0], [-1, 0]
        ];

        for (const [dx, dy] of directions) {
            const newX = currentX + dx;
            const newY = currentY + dy;

            if (this.map[newY] && this.map[newY][newX] !== undefined) {
                cells.push({ x: newX, y: newY });
            }
        }

        return cells;
    }

    move() {
        if (this.pathRequested) return;

        if (!this.path.length) return;

        const next = this.path[0];

        const dx = (next.x + 0.5) - this.x;
        const dy = (next.y + 0.5) - this.y;

        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.1) {
            this.path.shift();
            return;
        }

        const step = this.speed * 0.1;
        const move = Math.min(step, dist);

        this.x += (dx / dist) * move;
        this.y += (dy / dist) * move;
    }

    update() {
        this.calculatePath();
        this.move();
    }

    takeDamage(amount) {
        if (amount <= 0) return false;
        this.hp = Math.max(0, this.hp - amount);
        return this.hp === 0;
    }
}

module.exports = Unit;