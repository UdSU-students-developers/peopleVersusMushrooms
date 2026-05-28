const EasyStar = require('easystarjs');
const CONFIG = require('../../config');
const Worker = require('./entities/Units/Worker');

const Map = require('./entities/Map/Map');
const { 
    Driller,
    Mine,
    Barracks,
    Pipe,
    SmallReactor,
    LargeReactor,
    OilBarrel,
    IronBarrel
} = require('./entities/Buildings/buildingsIndex');

const { 
    PIPE, 
    IRON_BARREL, 
    OIL_BARREL, 
    BARRACKS, 
    DRILLER, 
    MINE, 
    SMALL_REACTOR, 
    LARGE_REACTOR 
} = CONFIG.ECONOMY.BUILDINGS;

const { INTERVAL } = CONFIG.ECONOMY.INTERVAL;

class Economy {
    constructor({ common, callbacks: { updated, spawnArmyUnit }, guids }) {
        this.easyStar = new EasyStar.js();
        this.guid = guids.peopleEconomy;
        this.common = common;
        this.callbacks = { updated, spawnArmyUnit };
        this.map = new Map();
        this.resourceMap; // массив известных ресурсов
        this.buildings = [];  // все построенные здания
        this.workers = [];

        this.plannedUnits = ['bmp', 'soldier', 'partizan', 'sniper'];
        this.plannedBuildings = []; // { type }

        this.enemyBuildings = []; // данные для врагов
        this.enemyUnits = [];

        this.updatedBuildings = []; // { }
        this.updatedUnits = []; // { }

        this.unknownPoints = [];
        this.knownResources = [];


        // данные про игроков
        this.guids = {
            spectator: null,
            peopleArmy: null,
            peopleEconomy: null,
            mushroomsArmy: null,
            mushroomsEconomy: null,
            mapGuid: null,
        };
        Object.keys(guids).forEach(key => this.guids[key] = guids[key]);

        // start game proccess
        this.updated = false;
        this.interval = setInterval(() => this.update(), INTERVAL);

        this._initEconomy();
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
            guids: this.guids,
            buildings: Object.values(this.buildings).map(b => b.get()),
            units: Object.values(this.workers).map(u => u.get()),
            map: this.map.get(),
        }
    }

    getUpdatedBuildings() {
        return this.updatedBuildings;
    }

    getUpdatedUnits() {
        return this.updatedUnits;
    }

    _initEconomy() {
        this._initUnknownPoints()
        this.createUnit({ x: 1, y: 1, type: 'worker'});
        this.createBuilding({ x: 2, y: 2, buildingType: DRILLER.type });
        this.createBuilding({ x: 2, y: 3, buildingType: MINE.type });
        this.createBuilding({ x: 3, y: 2, buildingType: PIPE.type });
        this.createBuilding({ x: 3, y: 3, buildingType: PIPE.type });
        this.createBuilding({ x: 4, y: 2, buildingType: LARGE_REACTOR.type });
        this.createBuilding({ x: 6, y: 2, buildingType: BARRACKS.type });
    }

    _destroyEntity(guid) {
        const index = [...this.buildings, ...this.workers].findIndex(u => u.guid === guid);
        if (!(index + 1)) return;
        if (index < this.buildings.length) {
            const building = this.buildings[index];
            this.updatedBuildings(building.getForMap());
            this.map.deleteBuilding(building.get());
            this.buildings.splice(index);
        } else {
            const unitIndex = index - this.buildings.length + 1;
            const unit = this.workers[unitIndex];
            this.updatedUnits(unit.getForMap());
            this.map.deleteUnit(unit.get());
            this.workers.splice[unitIndex];
        } 
        this.updated = true;
    }

    //инициализация неизвестных точек
    _initUnknownPoints() {
        for (let x = 0; x < 100; x++) {
            for (let y = 0; y < 100; y++) {
                this.unknownPoints.push({ x, y });
            }
        }
    }

    getNearestUnknownPoint(x, y) {
        if (this.unknownPoints.length === 0) return null;
        
        let nearest = null;
        let minDistance = Infinity;
        
        for (const point of this.unknownPoints) {
            const dx = Math.abs(x - point.x);
            const dy = Math.abs(y - point.y);
            const distance = dx * dx + dy * dy;
            
            if (distance < minDistance) {
                minDistance = distance;
                nearest = point;
            }
        }
        
        return nearest;
    }

    //отметить точку как исследованную
    markPointAsExplored(x, y) {
        const index = this.unknownPoints.findIndex(p => p.x === x && p.y === y);
        if (index !== -1) {
            this.unknownPoints.splice(index, 1);
        }
    }

    //добавить найденный ресурс
    addKnownResource(x, y, type, saturation) {
        const exists = this.knownResources.some(r => r.x === x && r.y === y);
        if (!exists) {
            this.knownResources.push({ x, y, type, saturation });
            console.log(`НАЙДЕН РЕСУРС: (${x}, ${y}) тип: ${type}, насыщение: ${saturation}`);
        }
    }

    //получить все известные ресурсы
    getKnownResources() {
        return this.knownResources;
    }

    //получить ресурс по координатам
    getKnownResourceAt(x, y) {
        return this.knownResources.find(r => r.x === x && r.y === y);
    }

    setRelief(relief) {
        this.map.setRelief(relief);
        for (const worker of this.workers) {
            if (worker.onReliefLoaded) {
                worker.onReliefLoaded();
            }
        }
    }

    setResources(resources) {
        this.map.setResources(resources);
    }

    findEntityByGuid(guid) {
        const found = [...this.workers, ...this.buildings].find(entity => entity.guid === guid);
        if (found) return found;
        return null;
    }

    applyDamage(guid, damage) {
        const entity = this.findEntityByGuid(guid);
        if (!entity) return false;
        const isDead = entity.takeDamage(damage);
        if (isDead) this._destroyEntity(guid);
        return true;
    }

    //создать юнита
    createUnit({ x, y, type = 'worker' }) {
        const unitGuid = this.common.guid();
        
        if (type === 'worker') {
            const worker = new Worker({
                guid: unitGuid,
                x,
                y,
                map: this.map,
                easystar: this.easyStar,
                economy: this
            });
            this.workers.push(worker);
            this.map.setUnit(worker.get());
            this.updatedUnits.push(worker.get());
            this.updated = true;
            return;
        }
        
        const unit = {
            guid: this.guids.peopleArmy,
            x,
            y,
            type
        };
        this.callbacks.spawnArmyUnit(unit);
    }

    /***** ПОСТРОЙКА ЗДАНИЙ *****/
    createBuilding({ x, y, buildingType }) {
        const guid = this.common.guid();
        let building = null;

        switch (buildingType) {
            case PIPE.type:
                building = new Pipe({ guid, x, y });
                break;
            case BARRACKS.type:
                building = new Barracks({ guid, x, y, callbacks: {
                    createUnit: (data) => this.createUnit(data)
                }});
                break;
            case SMALL_REACTOR.type:
                building = new SmallReactor({ guid, x, y });
                break;
            case LARGE_REACTOR.type:
                building = new LargeReactor({ guid, x, y });
                break;
            case DRILLER.type:
                building = new Driller({ guid, x, y });
                break;
            case MINE.type:
                building = new Mine({ guid, x, y });
                break;
            case OIL_BARREL.type:
                building = new OilBarrel({ guid, x, y });
                break;
            case IRON_BARREL.type:
                building = new IronBarrel({ guid, x, y });
                break; 
            default:
                return false;
        }
        this.buildings.push(building);
        this.map.setBuilding(building);
        this.updatedBuildings.push(building.getForMap());
        this.updated = true;
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

    distributeEnergy(reactors) {
        const consumers = this.buildings
            .filter(building => building.priority === 2 || building.priority === 3)
            .sort((a, b) => a.priority - b.priority);
        this.easyStar.setGrid(this.map.buildingsGrid);
        this.easyStar.setAcceptableTiles([1]);
        this.easyStar.setIterationsPerCalculation(20);
        consumers.forEach(consumer => {
            reactors.forEach(reactor => {
                if (consumer.store.ENERGY >= consumer.consumption) return;
                const energy = reactor.store.ENERGY;
                if (energy === 0) return;
                this.easyStar.findPath(consumer.y, consumer.x, reactor.y, reactor.x, path => {
                    if (!path) return;
                    reactor.store.ENERGY = Math.max(
                        energy - (consumer.consumption - consumer.store.ENERGY), 
                        0
                    );
                    consumer.store.ENERGY += energy - reactor.store.ENERGY;
                });
            });
        });
        this.easyStar.calculate();
    }

    distributeOil(drillers) {
        const barrels = this.buildings.filter(building =>
            building.type === OIL_BARREL.type
        );
        const consumers = this.buildings
            .filter(building => building.priority === 1)
            .sort(building => 
                (building.type === SMALL_REACTOR.type) ? 1 : -1
            );
        this.easyStar.setGrid(this.map.buildingsGrid);
        this.easyStar.setAcceptableTiles([1]);
        consumers.forEach(consumer => {
            [...drillers, ...barrels].forEach(dispenser => {
                if (consumer.store.OIL === consumer.consumption) return;
                const oil = dispenser.store.OIL;
                if (oil === 0) return;
                this.easyStar.findPath(consumer.y, consumer.x, dispenser.y, dispenser.x, path => {
                    if (!path) return;
                    dispenser.store.OIL = Math.max(
                        oil - (consumer.consumption - consumer.store.OIL), 
                        0
                    );
                    consumer.store.OIL += oil - dispenser.store.OIL;
                });
            });
        });
        this.easyStar.calculate();
    }

    distributeIron(mines) {
        const barrels = this.buildings.filter(building =>
            building.type === IRON_BARREL.type
        );
        const consumers = this.buildings.filter(building => building.priority === 3);
        this.easyStar.setGrid(this.map.buildingsGrid);
        this.easyStar.setAcceptableTiles([1]);
        consumers.forEach(consumer => {
            [...mines, ...barrels].forEach(dispenser => {
                if (consumer.store.IRON === consumer.capacity.IRON) return;
                const iron = dispenser.store.IRON;
                if (iron === 0) return;
                this.easyStar.findPath(consumer.y, consumer.x, dispenser.y, dispenser.x, path => {
                    if (!path) return;
                    dispenser.store.IRON = Math.max(
                        iron - (consumer.capacity.IRON - consumer.store.IRON), 
                        0
                    );
                    consumer.store.IRON += iron - dispenser.store.IRON;
                });
            });
        });
        this.easyStar.calculate();
    }

    // 1. выработать энергию (потратить нефть)
    generateEnergy() {
        //пробежаться по всем реакторам
        //каждый реактор потребляет нефть, перераспределенную в конце последнего update
        //если он смог потребить нефть => выработать энергию
        const reactors = this.buildings.filter(building => building.priority === 1);
        reactors.forEach(reactor => reactor.update());
        //распределить энергию по зданиям в приоритетах
        // 2 - добывающие постройки
        // 3 - казарма
        this.distributeEnergy(reactors);
    }
    // 2. потребить энергию шахтами (добыть нефть и железо)
    miningConsumption() {
        // пробежаться по всем буровым
        // потребить энергию, полученную в прошлом шаге (если есть)
        // добыть нефть и железо
        const miners = this.buildings.filter(building => building.priority === 2);
        miners.forEach(miner => miner.update());
        const drillers = miners.filter(miner => miner.type === DRILLER.type);
        const mines = miners.filter(miner => miner.type === MINE.type);
        // распределить нефть и железо куда-нибудь
        this.distributeOil(drillers);
        this.distributeIron(mines);
    }
    
    // 3. потребить остаток энергии заводами (потратить железо)
    produceUnits() {
        const barracks = this.buildings.filter(building => building.priority === 3);
        barracks.forEach(barrack => barrack.update(this.plannedUnits));
    }

    // 3.1. очистить энергии у зданий после тика
    clearEnergy() {
        this.buildings.forEach(building => building.clearEnergy());
    }

    // 4. переместить юнитов
    moveUnits() {
        this.workers.forEach(unit => unit.move())
    }


    // 6. Построить здания
    build() {

    }


    update() {
        /***********************/
        /* Про заводы */
        // 1. выработать энергию (потратить нефть) и распределить её
        this.generateEnergy();
        // 2. потребить энергию шахтами (добыть нефть и железо) и распределить её
        this.miningConsumption();
        // 3. потребить остаток энергии заводами (потратить железо)
        this.produceUnits();
        // 3.1 обнулить энергии
        this.clearEnergy();
        /************************/
        /* Про рабочих/крестьян */
        // ОБНОВЛЯЕМ СТАТУСЫ ВОРКЕРОВ
        this.updateWorkersStatus();
        // 4. переместить юнитов
        this.moveUnits();
        // 5. выдать ресурсы рабочему, если надо
        // 6. рабочим построить что-нибудь
        this.build();
        // 7. Запланировать здания и юнитов

        if (this.updated) {
            this.updated = false;
            this.callbacks.updated(this.get());
            this.updatedBuildings = [];
            this.updatedUnits = [];
        }
    }

}

module.exports = Economy;