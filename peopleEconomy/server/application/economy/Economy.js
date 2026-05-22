const EasyStar = require('easystarjs');
const CONFIG = require('../../config');

const { INTERVAL } = CONFIG.ECONOMY.INTERVAL

class Economy {
    constructor(db, common, callbacks, map, guid) {
        this.easyStar = new EasyStar.js();
        this.guid = guid;
        this.map = map;
        this.db = db;
        this.common = common;
        this.callbacks = callbacks;

        this.resourceMap; // массив известных ресурсов
        this.buildings = [];
        this.workers = []; 

        this.enemyBuildings = []; // данные для врагов
        this.enemyUnits = [];

        // start game proccess
        this.updated = false;
        this.interval = setInterval(() => this.update(), INTERVAL);
    }

    destructor() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    get() {
        return {
            guid: this.guid,
            buildings: Object.values(this.buildings).map(b => b.get()),
            map: this.map,
        }
    }


    //создать юнита
    createUnit({x, y, unitType, barracksGuid}) {

        //СОЗДАНИЕ ЮНИТА ПОКА БЕЗ ТРАТЫ РЕСУРСА 

        //находим здание по guid
        const barracks = this.buildings.find(b => b.guid === barracksGuid);
        if (!barracks) return false;
        
        //проверяем, что здание - казарма
        if (barracks.type !== 'barracks') return false;

        const unitGuid = this.common.guid();
        const unit = {
            guid: unitGuid,
            x: x,
            y: y,
            type: unitType
        };
        
        if (unitType === 'worker') {
            this.workers.push(unit);
        }
        
        this.updated = true;
        return unit;
    }

    /***** ПОСТРОЙКА ЗДАНИЙ *****/
    createBuilding({ x, y, buildingType }) {
        const guid = this.common.guid();
        let building = null;
        
        switch (buildingType) {
            case CONFIG.ECONOMY.BUILDINGS.PIPE:
                building = new Pipe({ guid, x, y });
                break;
            case CONFIG.ECONOMY.BUILDINGS.BARRACKS:
                building = new Barracks({ guid, x, y });
                break;
            case CONFIG.ECONOMY.BUILDINGS.SMALL_GENERATOR:
                building = new SmallGenerator({ guid, x, y });
                break;
            case CONFIG.ECONOMY.BUILDINGS.DRILLER:
                building = new Driller({ guid, x, y });
                break;
            default:
                return false;
        }
        
        this.buildings.push(building);
        this.updated = true;
        return building;
    }

     /***** УПРАВЛЕНИЕ ПОВЕДЕНИЕМ ЮНИТА *****/

    //расчет направления для бегства
    _calculateFleeDirection(enemies, worker) {
        if (!enemies || enemies.length === 0) return null;
        
        let sumX = 0;
        let sumY = 0;
        
        for (const enemy of enemies) {
            sumX += enemy.x;
            sumY += enemy.y;
        }
        
        const centerX = sumX / enemies.length;
        const centerY = sumY / enemies.length;
        
        //вектор от центра врагов к рабочему (противоположное направление)
        const dx = worker.x - centerX;
        const dy = worker.y - centerY;
        
        const length = Math.sqrt(dx * dx + dy * dy);
        
        //если воркер в центре масс врагов - выбираем случайное направление
        if (length === 0) {
            //случайный угол от 0 до 2П
            const angle = Math.random() * Math.PI * 2;
            dx = Math.cos(angle);
            dy = Math.sin(angle);
        } else {
            //нормализуем вектор
            dx /= length;
            dy /= length;
        }
        
        //бежим в сторону от центра врагов на расстояние = visibility*2
        const fleeDistance = worker.visibility * 2;
        const targetX = worker.x + (dx / length) * fleeDistance;
        const targetY = worker.y + (dy / length) * fleeDistance;
        
        //ограничиваем картой
        const maxX = this.map[0].length - 1;
        const maxY = this.map.length - 1;
        
        const target = {
            x: Math.round(Math.min(Math.max(targetX, 0), maxX)),
            y: Math.round(Math.min(Math.max(targetY, 0), maxY))
        };
        
        return target;
    }

    //обновление статусов воркеров
    updateWorkersStatus() {
        const enemyUnits = this.getEnemyUnits();
        
        for (const worker of this.workers) {
            //видимые враги
            const visibleEnemies = worker.getEnemiesInRadius(enemyUnits, worker.visibility);
            
            //враги в экстремальном радиусе
            const shouldFlee = worker.shouldFlee(visibleEnemies);
            
            switch (worker.getStatus()) {
                case CONFIG.ECONOMY.WORKER_STATUS.FLEE:
                    if (!shouldFlee) {
                        worker.setStatus(CONFIG.ECONOMY.WORKER_STATUS.SEARCH);
                    } else {
                        const fleeTarget = this._calculateFleeDirection(visibleEnemies, worker);
                        worker.setStatus(CONFIG.ECONOMY.WORKER_STATUS.FLEE, fleeTarget);
                    }
                    break;
                    
                case CONFIG.ECONOMY.WORKER_STATUS.SEARCH:
                    //...
                case CONFIG.ECONOMY.WORKER_STATUS.BUILD:
                    //...
                default:
                    if (shouldFlee) {
                        const fleeTarget = this._calculateFleeDirection(visibleEnemies, worker);
                        worker.setStatus(CONFIG.ECONOMY.WORKER_STATUS.FLEE, fleeTarget);
                    }
                    break;
            }
        }
    }


    //получить всех вражеских юнитов (вроде от GameManager)
    getEnemyUnits() {
        //...
        return this.enemyUnits || [];
    }

    // 1. выработать энергию (потратить нефть)
    generateEnergy() {
        //пробежаться по всем реакторам
        //для каждого реактора взять нефть для производства энергии
        //если в реакторе этой нефти нет,
        //то с помощтю матрицы достижимости выяснить ближайшую нефть и сразу потратить её
        //энергию записать в реакторы
    }

    // 2.1. потребить энергию шахтами (добыть нефть и железо)
    miningConsumption() {
        // пробежаться по всем буровым
        // для каждой уровой взять (вычесть) необходимую энергию из достижимых реакторов
        // добыть нефть
        // распределить нефть куда-нибудь
        // то же самое сделать для шахт
    }

    // 3. переместить юнитов
    moveUnits() {
        this.workers.forEach(unit => unit.move())
    }
    

    update() {
        /***********************/
        /* Про заводы */
        // 1. выработать энергию (потратить нефть)
        this.generateEnergy();
        // 2.1. потребить энергию шахтами (добыть нефть и железо)
        this.miningConsumption();
        // 2.5. потребить остаток энергиизаводами (потратить железо)

        /************************/
        /* Про рабочих/крестьян */
        // ОБНОВЛЯЕМ СТАТУСЫ ВОРКЕРОВ
        this.updateWorkersStatus();
        // 3. переместить юнитов
        this.moveUnits();
        // 4. выдать ресурсы рабочему, если надо
        // 5. рабочим построить что-нибудь

        if (this.updated) {
            this.updated = false;
            this.callbacks.updated(this.get());
        }
    }
    
}

module.exports = Economy;