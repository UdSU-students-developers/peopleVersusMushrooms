//GLOBAL
const GLOBAL_CONFIG = require('../../../../global/globalConfig');

//LOCAL
const EasyStar = require('easystarjs');
const CONFIG = require('../../config');

const Mycelium = require('./entities/Buildings/Mycelium');
const SmallReactor = require('./entities/Buildings/SmallReactor');
const Incubator = require('./entities/Buildings/Incubator');
const Larva = require('./entities/Unit/Larva')

const { INTERVAL } = GLOBAL_CONFIG;

class Economy {
    constructor({
        db,
        common,
        callbacks: { updated },
        guid,
        guids,
        startPoint,
    }) {
        this.easyStar = new EasyStar.js();
        this.easyStar.setGrid(map);
        this.easyStar.setAcceptableTiles([0]);
        this.guid = guid; // совпадает с guid игрока
        this.db = db;
        this.common = common;
        this.callbacks = { updated };
        // данные экономики
        this.resourceMap; // массив известных ресурсов [{x, y, value}]
        this.buildings = []; // здания
        this.mycelium = []; // грибница
        this.workers = []; // рабочие
        this.larvae = []; // массив личинок
        // данные про врагов
        this.enemyBuildings = [];
        // данные про игроков
        this.guids = {
            spectator: null,
            peopleArmy: null,
            peopleEconomy: null,
            mushroomsArmy: null,
            mushroomsEconomy: null,
        }
        Object.keys(guids).forEach(key => this.guids[key] = guids[key]);

        this.map = this._initEmptyMap();
        this._initBuildings(startPoint);
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

    get() {
        return {
            guid: this.guid,
            mushrooms: this.mycelium.map(m => m.get()),
            buildings: Object.values(this.buildings).map(b => b.get()),
            map: this.map,
            larvae: this.larvae.map(l => l.get()),
        }
    }

    _initEmptyMap() {
        const map = [];
        for (let i = 0; i < 50; i++) {
            map.push([]);
            for (let j = 0; j < 50; j++) {
                map[i].push(null);
            }
        }
        return map;
    }

    _initBuildings(startPoint) {
        // создать инкубатор
        // создать маленький реактор
        this.addSmallReactor(startPoint.x + 1, startPoint.y + 1);
        // создать грибничку

        this.callbacks.updated(this.get());
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

    updateLarvae() {
        this.larvae.forEach(larva => larva.update());
    }


    // 4. передвинуть рабочих
    moveWorkers() {
        this.workers.forEach(unit => unit.moveOneStep());
    }


    // 10. вырастить грибочки на грибнице
    myceliumGrow() {
        this.mycelium.forEach(mycelium => this.myceliumGrow(mycelium));
    }

    // 11. расширить грибницу
    myceliumExtend() {
        this.mycelium.forEach(mycelium => this.myceliumExtend(mycelium));
    }

    update() {
        // 1. Мутировать юнита из личинки (потратить железо)
        // 2. Мутировать здание из рабочего (потратить железо)
        // 3. передать боевых юнитов в армию (callback)
        // 3.5. для рабочих определить цели и задачи
        // 4. передвинуть рабочих
        this.moveWorkers();
        // 5. передвинуть личинки
        // 6. добыть энергию (сожрать грибочки)
        // 7. добыть железо (потратить энергию) и распределить их в инкубаторы, шахты или бочки для железа
        // 8. породить личинок (потратить немного железа и немного энергии)
        // 9. остаток непотраченной энергии (жир) распределить по бочкам для жира
        // 10. вырастить грибочки на грибнице
        this.myceliumGrow();
        // 11. расширить грибницу
        this.myceliumExtend();

        /*
        this.updateLarvae();
        // 3. реакторы потребляют мицелий
        this.reactorsConsume();
        // 1. создать личинку
        this.startIncubatorCreating();
        // 2. обновить прогресс и создать личинку
        this.updateIncubator();
        */

        // отбросить апдейт, если он случился
        if (this.updated) {
            this.updated = false;
            this.callbacks.updated(this.get());
        }
    }
}

module.exports = Economy;