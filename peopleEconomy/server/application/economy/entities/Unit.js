const Entity = require("./Entity");

class Unit extends Entity {
    constructor({ guid, x, y, map, easystar, callbacks = {}, type = null, hp = 1, visibility = 1, speed = 1 }) {
        //сначала вызываем super
        super({ guid, x, y, callbacks, type, hp, visibility });
        
        //потом инициализируем поля класса Unit
        this.speed = speed;
        this.easystar = easystar;
        this.map = map;
        
        this.isMoving = false;
        this.path = [];
        this.target = null;
        this.pathRequested = false;
        this.inertia = 0;
        this.currentPathVersion = 0;
        this.pockets = [];
    }

    get() {
        return {
            ...super.get(),
            speed: this.speed,
        };
    }

    //проверка, проходима ли клетка
    _isWalkable(x, y) {
        return this.map.relief[y] && this.map.relief[y][x] === 0;
    }

    //поиск ближайшей проходимой клетки к заданным координатам
    _findNearestWalkable(targetX, targetY, maxRadius = 10) {
        //если целевая клетка проходима - возвращаем её
        if (this._isWalkable(targetX, targetY)) {
            return { x: targetX, y: targetY };
        }
        
        const queue = [{ x: targetX, y: targetY, dist: 0 }];
        const visited = new Set();
        visited.add(`${targetX},${targetY}`);
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            //если превысили радиус поиска - пропускаем
            if (current.dist > maxRadius) continue;
            
            //проверяем соседние клетки в 4 направления
            const neighbors = [
                { x: current.x + 1, y: current.y, dist: current.dist + 1 },
                { x: current.x - 1, y: current.y, dist: current.dist + 1 },
                { x: current.x, y: current.y + 1, dist: current.dist + 1 },
                { x: current.x, y: current.y - 1, dist: current.dist + 1 }
            ];
            
            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;
                
                //проверяем границы карты через this.map.relief
                if (neighbor.x < 0 || neighbor.x >= this.map.relief[0].length) continue;
                if (neighbor.y < 0 || neighbor.y >= this.map.relief.length) continue;
                
                //если уже посещали - пропускаем
                if (visited.has(key)) continue;
                visited.add(key);
                
                //если клетка проходима - возвращаем её
                if (this._isWalkable(neighbor.x, neighbor.y)) {
                    return { x: neighbor.x, y: neighbor.y };
                }
                
                //иначе добавляем в очередь для дальнейшего поиска
                if (neighbor.dist <= maxRadius) {
                    queue.push(neighbor);
                }
            }
        }
        
        //ничего не нашли
        return null;
    }

    //строит путь
    calcPath({ x, y }) {
        if (!this.map.relief) return;
        
        this.target = { x, y };
        this.pathRequested = true;
        this.currentPathVersion++;
        const version = this.currentPathVersion;

        if (this.easystar.setGrid) this.easystar.setGrid(this.map.relief);
        this.easystar.setAcceptableTiles([0]);

        this.easystar.findPath(this.x, this.y, this.target.x, this.target.y, (path) => {
            if (version !== this.currentPathVersion) return;
            
            if (path && path.length > 0) {
                this.path = path;
                this.path.shift();
                this.isMoving = true;
            } else {
                this.economy.markPointAsExplored(this.target.x, this.target.y);
                this.target = null;
                this.path = [];
                this.isMoving = false;
            }
            this.pathRequested = false;
        });
        this.easystar.calculate();
    }

    //установка цели
    setTarget({x, y}) {
        if (!this.map?.relief) return;
        //находим ближайшую проходимую клетку к цели
        const walkableTarget = this._findNearestWalkable(x, y);
        
        if (!walkableTarget) {
            return;
        }
        
        //сбрасываем старую цель и путь
        this.target = null;
        this.path = [];
        this.isMoving = false;
        this.pathRequested = false;
        
        //устанавливаем цель и строим путь
        this.calcPath({ x: walkableTarget.x, y: walkableTarget.y });
    }

    _hasReachedTarget() {
        return this.target && this.x === this.target.x && this.y === this.target.y;
    }

    
    move() {
        if (!this.target) return;
        if (this._hasReachedTarget()) return;
        
        if (this.path.length === 0 && !this.pathRequested) {
            this.calcPath({ x: this.target.x, y: this.target.y });
            return;
        }
        
        if (this.pathRequested) return;
        if (this.path.length === 0) return;
        
        const step = this.path[0];
        if (!this._isWalkable(step.x, step.y)) {
            this.calcPath({ x: this.target.x, y: this.target.y });
            return;
        }
        
        this.inertia += this.speed;
        if (this.inertia < 1) return;
        
        this.inertia -= 1;
        this.x = step.x;
        this.y = step.y;
        this.path.shift();

        console.log(`Воркер ${this.guid} переместился на (${this.x}, ${this.y})`);
        
        if (this.x === this.target.x && this.y === this.target.y) {
            this.target = null;
            this.isMoving = false;
        }
    }

    takeDamage(amount) {
        if (amount <= 0) return false;
        this.hp = Math.max(0, this.hp - amount);
        return this.hp === 0;
    }
}

module.exports = Unit;