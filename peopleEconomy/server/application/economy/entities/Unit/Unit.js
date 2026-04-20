class Unit {
    constructor({ guid, x, y, map, easystar }) {
        this.guid = guid;
        this.x = x;
        this.y = y;
        this.hp = 1;
        this.speed = 1;

        this.easystar = easystar;
        this.map = map;    
        
        this.isMoving = false; //Можно ли переместить
        this.path = []; //Маршрут
        this.inertia = 0; // Накпление инерции
        this.target = null; //клетка цели
        this.pathRequested = false; // флаг, что путь запрошен
        
    }

    get() {
        return {
            guid: this.guid,
            x: this.x,
            y: this.y,
            hp: this.hp,
            speed: this.speed,   
        };
    }

    //найти ближайшую проходимую клетку к заданной
    _findNearestWalkable(targetX, targetY, maxRadius = CONFIG.ECONOMY.UNIT.RADIUS) {
        
        if (this._isCellWalkable(targetX, targetY)) {
            return { x: targetX, y: targetY };
        }

        return this._searchNearestWalkable(targetX, targetY, maxRadius);
    }

    _isCellWalkable(x, y) { //клетка находится в пределах карты и имеет значение 0
        return this.map[y] && this.map[y][x] === 0;
    }

    _searchNearestWalkable(startX, startY, maxRadius) { //поиск ближайшей проходимой клетки
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

            if (distance > maxRadius) break;

            if (this._isCellWalkable(x, y)) {
                return { x, y };
            }

            this._addNeighborsToQueue(x, y, distance + 1, addToQueue);
        }

        return null;
    }

    _addNeighborsToQueue(x, y, newDistance, addToQueue) { //Вспомогательный метод верх низ и тд
        const neighbors = [
            { x: x + 1, y: y },
            { x: x - 1, y: y },
            { x: x, y: y + 1 },
            { x: x, y: y - 1 }
        ];

        for (const neighbor of neighbors) {
            if (this._isCellWithinBounds(neighbor.x, neighbor.y)) {
                addToQueue(neighbor.x, neighbor.y, newDistance);
            }
        }
    }

    _isCellWithinBounds(x, y) { // клетка существует в матрице
        return this.map[y] && this.map[y][x] !== undefined;
    }

    calcPath({ x, y }) { //строит путь
        let corrected = this._findNearestWalkable(x, y);
        if (!corrected) {
            this.isMoving = false;
            this.path = null;
            this.target = null;
            this.pathRequested = false;
            return;
        }

        this.target = corrected;
        this.pathRequested = true;

        if (this.easystar.setGrid) this.easystar.setGrid(this.map);

        this.easystar.findPath(this.x, this.y, this.target.x, this.target.y, (path) => {
            if (path) {
                this.path = path;
                this.isMoving = true;
            } else {
                this.path = null;
                this.isMoving = false;
            }
            this.pathRequested = false;
        });

        this.easystar.calculate();
    }

    _recalculatePath() { // Перестраивает путь к текущей цели
        if (!this.target) return;
        this.calcPath(this.target.x, this.target.y);
    }

    moveOneStep() { // Продвигает юнита на один шаг
        if (!this.isMoving) return false;

        if (this.pathRequested) return false;

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
            this._recalculatePath();
            this.isMoving = false;  
            this.inertia = 0;
            return false;
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