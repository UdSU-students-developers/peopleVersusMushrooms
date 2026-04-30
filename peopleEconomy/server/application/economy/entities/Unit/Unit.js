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

        this.pockets = [] //карманы, внутрий склад юнита
        
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

    calcPath({ x, y }) { //строит путь
        this.target = { x, y };
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
        this.calcPath({ x: this.target.x, y: this.target.y });
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

    //установка цели
    setTarget({x, y}) {
  
        //сбрасываем старую цель и путь
        this.target = null;
        this.path = [];
        this.isMoving = false;
        this.pathRequested = false;
        
        //устанавливаем цель и строим путь
        this.calcPath({ x, y });
    }

    move() {
        //если нет цели -> определить её
        //если цель отличается от текущей цели -> сбросить цель
        //если нет пути -> найти путь до цели
        //если есть найденный путь -> идти к цели
        //если накопилась инерция, сделать шаг
        //если клетка, на которую хочет наступить ненаступаема -> сбросить путь
        
        //если нет цели - выходим
        if (!this.target) return;
        
        //если путь пустой - пробуем построить
        if (this.path.length === 0) {
            if (!this.pathRequested) {
                this.calcPath({ x: this.target.x, y: this.target.y });
            }
            return;
        }
        
        //есть найденный путь -> идти к цели
        //если накопилась инерция, сделать шаг
        this.moveOneStep();
    }
}

module.exports = Unit;