const CONFIG = require("../../../config");

class Unit {
    constructor({ x, y, guid, map, easystar }) {
        this.x = x;
        this.y = y;
        this.guid = guid;
        this.easystar = easystar;
        this.map = map;
        this.hp = 1;
        this.speed = 1;
        this.isMoving = false;
        this.path = [];
        this.inertia = 0;
        this.target = null;
    }

    get() {
        return {
            x: this.x,
            y: this.y,
            hp: this.hp,
            guid: this.guid
        };
    }

    findNearestWalkable(targetX, targetY, maxRadius = CONFIG.ECONOMY.UNIT.RADIUS) {
        if (this._isCellWalkable(targetX, targetY)) {
            return { x: targetX, y: targetY };
        }

        return this._searchNearestWalkable(targetX, targetY, maxRadius);
    }

    _isCellWalkable(x, y) {
        return this.map[y] && this.map[y][x] === 0;
    }

    _searchNearestWalkable(startX, startY, maxRadius) {
        const queue = [{ x: startX, y: startY, distance: 0 }];
        const visited = new Set();

        const getKey = (x, y) => `${x},${y}`;
        const addToQueue = (x, y, distance) => {
            const key = getKey(x, y);
            if (!visited.has(key)) {
                visited.add(key);
                queue.push({ x, y, distance });
            }
        };

        while (queue.length > 0) {
            const { x, y, distance } = queue.shift();

            // Если вышли за пределы радиуса - прекращаем поиск
            if (distance > maxRadius) break;

            // Нашли свободную клетку - возвращаем
            if (this._isCellWalkable(x, y)) {
                return { x, y };
            }

            // Добавляем соседние клетки для дальнейшего поиска
            this._addNeighborsToQueue(x, y, distance + 1, addToQueue);
        }

        return null; // Свободная клетка не найдена
    }

    _addNeighborsToQueue(x, y, newDistance, addToQueue) {
        const neighbors = [
            { x: x + 1, y: y },     // право
            { x: x - 1, y: y },     // лево
            { x: x, y: y + 1 },     // низ
            { x: x, y: y - 1 }      // верх
        ];

        for (const neighbor of neighbors) {
            if (this._isCellWithinBounds(neighbor.x, neighbor.y)) {
                addToQueue(neighbor.x, neighbor.y, newDistance);
            }
        }
    }

    _isCellWithinBounds(x, y) {
        return this.map[y] && this.map[y][x] !== undefined;
    }

    calcPath({ x, y }) {
        let corrected = this.findNearestWalkable(x, y);
        if (!corrected) {
            this.isMoving = false;
            this.path = null;
            this.target = null;
            return Promise.resolve(false);
        }
        this.target = corrected;

        if (this.easystar.setGrid) this.easystar.setGrid(this.map);

        return new Promise((resolve) => {
            this.easystar.findPath(this.x, this.y, this.target.x, this.target.y, (path) => {
                if (path) {
                    this.path = path;
                    this.isMoving = true;
                    resolve(true);
                } else {
                    this.path = null;
                    this.isMoving = false;
                    resolve(false);
                }
            });
            this.easystar.calculate();
        });
    }

    async recalculatePath() {
        if (!this.target) return false;
        const success = await this.calcPath(this.target.x, this.target.y);
        return success;
    }

    async moveOneStep() {
        if (!this.isMoving) return false;
        if (!this.path || this.path.length === 0) {
            this.isMoving = false;
            return false;
        }

        this.inertia += this.speed;
        if (this.inertia < 1) return false;

        let nextStep = this.path[0];
        if (nextStep.x === this.x && nextStep.y === this.y) {
            this.path.shift();
            nextStep = this.path[0];
        }

        if (!nextStep) {
            this.isMoving = false;
            this.inertia = 0;
            return false;
        }

        const isWalkable = this.map[nextStep.y] && this.map[nextStep.y][nextStep.x] === 0;
        if (!isWalkable) {
            const success = await this.recalculatePath();
            if (!success) {
                this.isMoving = false;
                this.inertia = 0;
            }
            return false; // не двигаемся в этом тике, но isMoving может остаться true
        }

        this.inertia -= 1;

        this.x = nextStep.x;
        this.y = nextStep.y;
        this.path.shift();

        if (this.path.length === 0) {
            this.isMoving = false;
        }

        return true;
    }
}

module.exports = Unit;