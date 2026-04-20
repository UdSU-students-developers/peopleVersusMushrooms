//LOCAL
const EasyStar = require('easystarjs');
const CONFIG = require('../../config');

const Mycelium = require('./entities/Buildings/Mycelium');
const SmallReactor = require('./entities/Buildings/SmallReactor');
const Incubator = require('./entities/Buildings/Incubator');
const Larva = require('./entities/Unit/Larva')

const { INTERVAL } = CONFIG.ECONOMY;

class Economy {
    constructor({
        db,
        common,
        callbacks: { updated },
        map,
        guid
    }) {
        this.easyStar = new EasyStar.js();
        this.easyStar.setGrid(map);
        this.easyStar.setAcceptableTiles([0]);
        this.guid = guid; // совпадает с guid игрока
        this.db = db;
        this.common = common;
        this.callbacks = { updated };
        this.map = map;
        // данные экономики
        this.resourceMap; // массив известных ресурсов [{x, y, value}]
        this.buildings = []; // здания
        this.mycelium = []; // грибница
        this.workers = []; // рабочие
        this.larvae = []; // массив личинок
        // данные про врагов
        this.enemyBuildings = [];
        //...

        //Не придумал куда сунуть
        this.peopleArmyGuid = '';
        this.p

        /**************/

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

    addLarva(x, y, homeX, homeY) {
        const larvaGuid = this.common.guid();
        this.larvae.push(new Larva({
            x: x,
            y: y,
            homeX: homeX,
            homeY: homeY,
            guid: larvaGuid,
            map: this.map,
            easystar: this.easyStar
        }));
    }

    get() {
        return {
            guid: this.guid,
            mushrooms: this.mycelium.map(m => m.get()),
            buildings: Object.values(this.buildings).map(b => b.get()),
            map: this.map,
            larvae: this.larvae.map(l => l.get()),
        }
    }


    // Методы добавления объектов

    addSmallReactor(x, y) {
        const reactorGuid = this.common.guid();
        this.buildings.push(new SmallReactor({
            type: CONFIG.ECONOMY.BIO_REACTOR_SMALL.TYPE,
            guid: reactorGuid,
            x,
            y,
        }));
    }

    addMycelium(x, y) {
        this.mycelium.push(new Mycelium({
            x,
            y,
            guid: this.common.guid(),
            callbacks: {},
        }));
    }


    // 1. вырасти грибочки
    myceliumGrow(mycelium) {
        if (mycelium.update()) {
            this.updated = true;
        }
    }

    // 2. расширить грибницу при возможности
    myceliumExtend(mycelium) {
        if (mycelium.canExtend(this.map, this.mycelium, this.buildings, this.enemyBuildings)) {
            const result = mycelium.extend(this.map, this.mycelium, this.buildings, this.enemyBuildings);
            if (!result) {
                return;
            }
            this.addMycelium(result.x, result.y);
            this.updated = true;
        }
    }

    reactorsConsume() {
        this.buildings
            .filter(b => b instanceof SmallReactor)
            .forEach(reactor => {
                reactor.getConsumable(this.mycelium).forEach(mc => mc.consume());
            });
    }

    setPathsUnits({ x, y }) {
        //пометка что надо будет сделать массив с юнитами общий
        [...this.workers].forEach(unit => unit.calcPath({ x, y }));
    }

    moveUnits() {
        [...this.workers].forEach(unit => unit.moveOneStep())
    }

    startIncubatorCreating() {
        this.buildings
            .filter(b => b instanceof Incubator)
            .forEach(incubator => {
                if (incubator.startCreating()) {
                    this.updated = true;
                }
            });
    }

    updateIncubator() {
        const availableEnergy = this.getAvailableEnergy();
        
        this.buildings
            .filter(building => building instanceof Incubator)
            .forEach(incubator => {
                if (incubator.updateLarvaProgress(availableEnergy)) {
                    this.updated = true;
                    this.consumeEnergyFromReactors(incubator.consumption);
                }

                const larva = incubator.createLarva();
                if (larva) {
                    this.larvae.push(larva);
                    this.updated = true;
                }
            });
    }

    getAvailableEnergy() {
        return this.buildings
            .filter(b => b instanceof SmallReactor)
            .reduce((sum, reactor) => sum + reactor.energy, 0);
    }

    consumeEnergyFromReactors(amount) {
        let remainingAmount = amount;
        const reactors = this.buildings.filter(b => b instanceof SmallReactor);

        for (const reactor of reactors) {
            if (remainingAmount <= 0) break;

            const consumeEnergy = Math.min(reactor.energy, remainingAmount);
            reactor.energy -= consumeEnergy;
            remainingAmount -= consumeEnergy;
        }
    }

    update() {

        //console.log(this.mycelium.length);

        /****************/
        /* про грибницу */
        // 1. вырасти грибочки
        this.mycelium.forEach(mycelium => this.myceliumGrow(mycelium));
        this.updateLarvae();
        // 2. расширить грибницу при возможности
        this.mycelium.forEach(mycelium => this.myceliumExtend(mycelium));
        // 3. реакторы потребляют мицелий
        this.reactorsConsume();
        // 4. Переместить юнитов если нужно
        this.moveUnits();
        /****************/

        /* про инкубатор */
        // 1. создать личинку
        this.startIncubatorCreating();
        // 2. обновить прогресс и создать личинку
        this.updateIncubator();
        /****************/

        if (this.updated) {
            this.updated = false;
            this.callbacks.updated(this.get());
        }
    }

    updateLarvae() {
        this.larvae.forEach(larva => larva.update());
    }
}

module.exports = Economy;