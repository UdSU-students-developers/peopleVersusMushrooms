const Unit = require("../Unit");
const CONFIG = require("../../config");

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
    }

    get() {
        return { ...super.get(), hp: this.hp, status: this.status };
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
                //...
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