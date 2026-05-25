const Entity = require("./Entity");

class Unit extends Entity {
    constructor({ guid, x, y, map, easystar, callbacks = {} }) {
        this.guid = guid;
        this.x = x;
        this.y = y;
        this.hp = 1;
        this.speed = 1;
        this.type = null; 
        this.visibility = 1;

        this.easystar = easystar;
        this.map = map;    
        
        this.isMoving = false; //Можно ли переместить
        this.path = []; //Маршрут
        this.target = null; //клетка цели
        this.pathRequested = false; // флаг, что путь запрошен
        this.inertia = 0; // Накопление инерции
        
        this.currentPathVersion = 0; // версия пути для отмены устаревших запросов

        this.pockets = [] //карманы, внутренний склад юнита
    }

    get() {
        return {
            ...super.get(),
            speed: this.speed,
        };
    }

    //проверка, проходима ли клетка
    _isWalkable(x, y) {
        return this.map[y] && this.map[y][x] === 0;
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
                
                //проверяем границы карты
                if (neighbor.x < 0 || neighbor.x >= this.map[0].length) continue;
                if (neighbor.y < 0 || neighbor.y >= this.map.length) continue;
                
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
        
        //ниче не нашли
        return null;
    }

    //строит путь
    calcPath({ x, y }) {
        this.target = { x, y };
        this.pathRequested = true;
        
        //увеличиваем версию пути для отмены устаревших запросов
        this.currentPathVersion++;
        const version = this.currentPathVersion;

        if (this.easystar.setGrid) this.easystar.setGrid(this.map);

        this.easystar.findPath(this.x, this.y, this.target.x, this.target.y, (path) => {
            //если версия не совпадает - игнорируем
            if (version !== this.currentPathVersion) return;
            
            if (path && path.length > 0) {
                this.path = path;
                this.path.shift(); // удаляем текущую позицию
                this.isMoving = true;
            } else {
                this.path = [];
                this.isMoving = false;
            }
            this.pathRequested = false;
        });

        this.easystar.calculate();
    }

    //установка цели
    setTarget({x, y}) {
        //находим ближайшую проходимую клетку к цели
        const walkableTarget = this._findNearestWalkable(x, y);
        
        if (!walkableTarget) {
            //цель недостижима - ниче не делаем
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
        if (this._hasReachedTarget()) {
            return;
        }
        
        //если путь пустой - пробуем построить
        if (this.path.length === 0 && !this.pathRequested) {
            this.calcPath({ x: this.target.x, y: this.target.y });
            return;
        }
        
        //если идет запрос пути - ждем
        if (this.pathRequested) return;
        
        //если путь пустой - выходим
        if (this.path.length === 0) return;
        
        //берем следующий шаг
        const step = this.path[0];
        
        //если клетка, на которую хочет наступить, непроходима - сбросить путь
        if (!this._isWalkable(step.x, step.y)) {
            this.calcPath({ x: this.target.x, y: this.target.y });
            return;
        }
        
        //копим инерцию
        this.inertia += this.speed;
        if (this.inertia < 1) return;
        
        //делаем шаг
        this.inertia -= 1;
        this.x = step.x;
        this.y = step.y;
        this.path.shift(); // удаляем пройденную клетку из пути
        
        //проверяем, достигли ли цели
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