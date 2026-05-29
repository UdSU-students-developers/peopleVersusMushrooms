const Unit = require("../Unit");
const CONFIG = require("../../../../config");

const { HP, SPEED, TYPE, VISIBILITY } = CONFIG.ECONOMY.WORKER;
const { WORKER_STATUS, SEARCH, BUILD, FLEE } = CONFIG.ECONOMY;

class Worker extends Unit {
    constructor(options) {
        super({ 
            ...options,
            type: TYPE,
            visibility: VISIBILITY
        });
        this.hp = HP;
        this.speed = SPEED;
        this.status = WORKER_STATUS.SEARCH;
        this.economy = options.economy;
        this.pendingTarget = null; // цель, которую нужно установить после загрузки карты
        this.reliefLoaded = false; // флаг, что рельеф загружен
        
        console.log(`Воркер ${this.guid} создан, статус: ${this.status}`);
        
        // если рельеф еще не загружен, сохраняем цель
        if (!this.economy.map.relief) {
            this.pendingTarget = this.economy.getNearestUnknownPoint(this.x, this.y);
        } else {
            this.setStatus(WORKER_STATUS.SEARCH);
        }
    }

    get() {
        return { ...super.get(), hp: this.hp, status: this.status };
    }

    //вызывается из Economy, когда рельеф загружен
    onReliefLoaded() {
        this.reliefLoaded = true;
        if (this.pendingTarget) {
            this.setTarget({ x: this.pendingTarget.x, y: this.pendingTarget.y });
            this.pendingTarget = null;
        } else {
            this.setStatus(WORKER_STATUS.SEARCH);
        }
    }

    //установить статус поведения
    setStatus(status, target = null) {
        this.status = status;
        
        switch (status) {
            case WORKER_STATUS.FLEE:
                if (target) {
                    this.setTarget({ x: target.x, y: target.y });
                }
                break;
            case WORKER_STATUS.SEARCH:
                //смотрит на массив неизвестных точек в экономике
                //ищет точку с найменьшей суммой координат и идет к ней
                //когда доходит до точки, то такая точка становиться не неизвестной
                //если эта точка является ресурсом, то она записывается в массив видимых ресурсов в экономике, который импользуют все воркеры
                
                //проверяем, загружен ли рельеф
                if (!this.economy.map.relief) {
                    this.pendingTarget = this.economy.getNearestUnknownPoint(this.x, this.y);
                    return;
                }
                const unknownPoint = this.economy.getNearestUnknownPoint(this.x, this.y);
                if (unknownPoint) {
                    this.setTarget({ x: unknownPoint.x, y: unknownPoint.y });
                }
                break;
            case WORKER_STATUS.BUILD:
                //...
                //смотрим в свои постройки -> принимаем решение что-то построить (на основе очереди на стриотелсьттво?)
                //выбираем место для постройки
                //строим
            default:
                this.status = WORKER_STATUS.SEARCH;
                break;
        }
    }

    //обновление поведения в статусе SEARCH
    updateSearchStatus() {
        if (!this.target || this._hasReachedTarget()) {
            if (this.target && this._hasReachedTarget()) {
                this.economy.markPointAsExplored(this.target.x, this.target.y);
                const resource = this.economy.map.resources[this.target.y]?.[this.target.x];
                if (resource && resource.saturation > 0) {
                    this.economy.addKnownResource(this.target.x, this.target.y, resource.type, resource.saturation);
                }
            }
            
            let unknownPoint = this.economy.getNearestUnknownPoint(this.x, this.y);
            while (unknownPoint) {
                const walkableTarget = this._findNearestWalkable(unknownPoint.x, unknownPoint.y);
                if (walkableTarget && (walkableTarget.x !== unknownPoint.x || walkableTarget.y !== unknownPoint.y)) {
                    this.economy.markPointAsExplored(unknownPoint.x, unknownPoint.y);
                    unknownPoint = this.economy.getNearestUnknownPoint(this.x, this.y);
                } else {
                    break;
                }
            }
            
            if (unknownPoint) {
                this.setTarget({ x: unknownPoint.x, y: unknownPoint.y });
            }
        }
    }

    //переопределяем move
    move() {
        const oldX = this.x;
        const oldY = this.y;

        if (this.status === WORKER_STATUS.SEARCH) {
            this.updateSearchStatus();
        }
        super.move();

        if (oldX !== this.x || oldY !== this.y) {
            this.economy.updatedUnits.push(this.get());
            this.economy.updated = true;
        }
    }

    //получить текущий статус
    getStatus() {
        return this.status;
    }

    //проверка, надо ли бежать (есть ли враги в экстрем радиусе) ... отдает true если надо, false не надо (врага нет в экстрим радиусе)
    shouldFlee(enemies) {
        const extremeRadius = Math.floor(this.visibility * CONFIG.ECONOMY.FLEE.DETECTION_RATIO);
        const enemiesInExtremeRadius = this.getEnemiesInRadius(enemies, extremeRadius);
        return enemiesInExtremeRadius.length > 0;
    }

    //проверка, находится ли точка в радиусе от рабочего
    _isInRadius(x, y, radius) {
        const dx = Math.abs(this.x - x);
        const dy = Math.abs(this.y - y);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= radius;
    }

    //получить всех врагов в заданном радиусе
    getEnemiesInRadius(enemies, radius) {
        if (!enemies || enemies.length === 0) return [];
        
        return enemies.filter(enemy => this._isInRadius(enemy.x, enemy.y, radius));
    }

    //постройка здания
    createBuilding({ x, y, buildingType }) {
        //проверяем, что тип здания существует в конфиге
        const buildingKey = Object.keys(CONFIG.ECONOMY.BUILDINGS).find(
            key => CONFIG.ECONOMY.BUILDINGS[key] === buildingType
        );
        
        if (!buildingKey) {
            return false;
        }

        //проверка, что точка находится в радиусе досягаемости
        if (!this._isInRadius(x, y, CONFIG.ECONOMY.UNIT.RADIUS)) {
            return false;
        }
        
        //вызываем создание здания
        this.economy.createBuilding({ x, y, buildingType }); 
        return true;
    }
}

module.exports = Worker;