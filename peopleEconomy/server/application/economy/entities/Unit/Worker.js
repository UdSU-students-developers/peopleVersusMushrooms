const Unit = require("./Unit");
const CONFIG = require("../../config");

const { HP, SPEED, TYPE, VISIBILITY } = CONFIG.ECONOMY.WORKER;

class Worker extends Unit {
    constructor(options) {
        super({ 
            ...options,
            type: TYPE,
            visibility: VISIBILITY
        });
        this.hp = HP;
        this.speed = SPEED;
        this.economy = options.economy;
    }

    //проверка, находится ли точка в радиусе от рабочего
    _isInRadius(x, y, radius = CONFIG.ECONOMY.UNIT.RADIUS) {
        const dx = Math.abs(this.x - x);
        const dy = Math.abs(this.y - y);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= radius;
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
        if (!this._isInRadius(x, y)) {
            return false;
        }
        
        //вызываем создание здания
        this.economy.createBuilding({ x, y, buildingType }); 
        return true;
    }
}

module.exports = Worker;