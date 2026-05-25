const EasyStar = require('easystarjs');
const CONFIG = require('../../config');

const Map = require('./entities/Map/Map');
const Driller = require('./entities/Buildings/Driller');
const Mine = require('./entities/Buildings/Mine');
const LargeReactor = require('./entities/Buildings/Reactors/LargeReactor');
const Barracks = require('./entities/Buildings/Barracks');

const { INTERVAL } = CONFIG.ECONOMY.INTERVAL

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

        this.plannedBuildings = []; // запланированные здания

        this.buildingsMap = Array.from({ length: 100 }, () => Array(100).fill(0));
        this.unitsMap = Array.from({ length: 100 }, () => Array(100).fill(0));

        this.enemyBuildings = []; // данные для врагов
        this.enemyUnits = [];

        this.updatedBuildings = []; // {x, y, type}
        this.updatedUnits = []; // { type }


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
        this.createUnit({ x: 10, y: 10 });
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
        const driller = new Driller({
            guid: this.common.guid(),
            x: 2,
            y: 2,
            callbacks: {}
        });
        const mine = new Mine({
            guid: this.common.guid(),
            x: 2,
            y: 3,
            callbacks: {}
        });
        const reactor = new LargeReactor({
            guid: this.common.guid(),
            x: 3,
            y: 2,
            callbacks: {}
        });
        const barrack = new Barracks({
            guid: this.common.guid(),
            x: 5,
            y: 2,
            callbacks: {}
        });
        this.updatedBuildings.push(driller.getForMap());
        this.updatedBuildings.push(mine.getForMap());
        this.updatedBuildings.push(reactor.getForMap());
        this.updatedBuildings.push(barrack.getForMap());
        this.updated = true;
    }

    setRelief(relief) {
        this.map.setRelief(relief);
    }

    setResources(resources) {
        this.map.setResources(resources);
    }

    //создать юнита
    createUnit({ x, y, type = null }) {
        const unit = {
            guid: this.common.guid(),
            x,
            y,
            type
        };
        if (unit.type === 'worker') {
            this.workers.push(unit);
            this.updatedUnits(unit);
            this.updated = true;
            return
        }
        unit.guid = this.guids.peopleArmy;
        this.callbacks.spawnArmyUnit(unit);
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

    distributeEnergy(reactors) {
        const consumers = this.buildings
            .filter(building => building.priority === 2 || building.priority === 3)
            .sort((a, b) => a.priority - b.priority);
        this.easyStar.setGrid(this.buildingsMap);
        this.easyStar.setAcceptableTiles([1]);
        consumers.forEach(consumer => {
            this.reactors.forEach(reactor => {
                if (consumer.store.ENERGY === consumer.consumption) return;
                const energy = reactor.store.ENERGY;
                if (energy === 0) return;
                this.easyStar.findPath(consumer.x, consumer.y, reactor.x, reactor.y, path => {
                    if (!path) return;
                    reactor.store.ENERGY = Math.max(
                        energy - (consumer.consumption - consumer.store.ENERGY), 
                        0
                    );
                    consumer.store.ENERGY += energy - reactor.store.ENERGY;
                });
                this.easyStar.calculate();
            });
        });
    }

    distributeOil(drillers) {
        const barrels = this.buildings.filter(building =>
            building.type === CONFIG.ECONOMY.BUILDINGS.OIL_BARREL.type
        );
        const consumers = this.buildings
            .filter(building => building.priority === 1)
            .filter(building => 
                (building.type === CONFIG.ECONOMY.BUILDINGS.SMALL_REACTOR.type) ? 1 : -1
            );
        this.easyStar.setGrid(this.buildingsMap);
        this.easyStar.setAcceptableTiles([1]);
        consumers.forEach(consumer => {
            [...this.drillers, ...barrels].forEach(dispenser => {
                if (consumer.store.OIL === consumer.consumption) return;
                const oil = dispenser.store.OIL;
                if (oil === 0) return;
                this.easyStar.findPath(consumer.x, consumer.y, dispenser.x, dispenser.y, path => {
                    if (!path) return;
                    dispenser.store.OIL = Math.max(
                        oil - (consumer.consumption - consumer.store.OIL), 
                        0
                    );
                    consumer.store += oil - dispenser.store.OIL;
                });
                this.easyStar.calculate();
            });
        });
    }

    distributeIron(mines) {
        const barrels = this.buildings.filter(building =>
            building.type === CONFIG.ECONOMY.BUILDINGS.IRON_BARREL.type
        );
        const consumers = this.buildings.filter(building => building.priority === 3);
        this.easyStar.setGrid(this.buildingsMap);
        this.easyStar.setAcceptableTiles([1]);
        consumers.forEach(consumer => {
            [...this.drillers, ...barrels].forEach(dispenser => {
                if (consumer.store.OIL === consumer.consumption) return;
                const oil = dispenser.store.OIL;
                if (oil === 0) return;
                this.easyStar.findPath(consumer.x, consumer.y, dispenser.x, dispenser.y, path => {
                    if (!path) return;
                    dispenser.store.OIL = Math.max(
                        oil - (consumer.consumption - consumer.store.OIL), 
                        0
                    );
                    consumer.store += oil - dispenser.store.OIL;
                });
                this.easyStar.calculate();
            });
        });
    }

    // 1. выработать энергию (потратить нефть)
    generateEnergy() {
        //пробежаться по всем реакторам
        //каждый реактор потребляет нефть, перераспределенную в конце последнего update
        //если он смог потребить нефть => выработать энергию
        const reactors = this.buildings.filter(building => building.priority == 1);
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
        const miners = this.buildings.filter(building => building.priority == 2);
        miners.forEach(miner => miner.update());
        const drillers = miners.filter(miner => miner.type === CONFIG.ECONOMY.BUILDINGS.DRILLER.type);
        const mines = miners.filter(miner => miner.type === CONFIG.ECONOMY.BUILDINGS.MINE.type);
        // распределить нефть и железо куда-нибудь
        this.distributeOil(drillers);
        this.distributeIron(mines);
    }
    
    // 3. потребить остаток энергии заводами (потратить железо)
    produceUnits() {
        const barracks = this.buildings.filter(building => building.priority === 3);
        barracks.forEach(barrack => barrack.update(this.plannedUnits));
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
        }
    }

}

module.exports = Economy;