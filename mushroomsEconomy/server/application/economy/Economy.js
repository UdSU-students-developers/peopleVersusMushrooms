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

        //Здания
        this.buildings = {
            smallReactors: [],// малые реакторы 
            incubators: [], //инкубаторы
            mycelium: [], // грибница
        };

        //Юниты всякие
        this.units = {
            workers: [], //рабочие
            larvae: [], //личинки
        };

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
            buildings: {
                smallReactors: this.buildings.smallReactors.map(r => r.get()),
                incubators: this.buildings.incubators.map(i => i.get()),
                mycelium: this.buildings.mycelium.map(m => m.get()),
            },
            units: {
                workers: this.units.workers.map(w => w.get()),
                larvae: this.units.larvae.map(l => l.get()),
            },
            map: this.map,
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
        this.units.larvae.push(new Larva({
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
        this.buildings.smallReactors.push(new SmallReactor({
            type: CONFIG.ECONOMY.BIO_REACTOR_SMALL.TYPE,
            guid: reactorGuid,
            x,
            y,
        }));
    }

    addMycelium(x, y) {
        this.buildings.mycelium.push(new Mycelium({
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
        if (mycelium.canExtend(this.map, this.buildings.mycelium, this.buildings, this.enemyBuildings)) {
            const result = mycelium.extend(this.map, this.buildings.mycelium, this.buildings, this.enemyBuildings);
            if (!result) {
                return;
            }
            this.addMycelium(result.x, result.y);
            this.updated = true;
        }
    }

    reactorsConsume() {
        this.buildings.smallReactors
            .forEach(reactor => {
                reactor.getConsumable(this.buildings.mycelium).forEach(mc => mc.consume());
            });
    }

    setPathsUnits({ x, y }) {
        //пометка что надо будет сделать массив с юнитами общий
        [...this.units.workers].forEach(unit => unit.calcPath({ x, y }));
    }

    startIncubatorCreating() {
        this.buildings.incubators
            .forEach(incubator => {
                if (incubator.startCreating()) {
                    this.updated = true;
                }
            });
    }

    updateIncubator() {
        const availableEnergy = this.getAvailableEnergy();
        this.buildings.incubators
            .forEach(incubator => {
                if (incubator.updateLarvaProgress(availableEnergy)) {
                    this.updated = true;
                    this.consumeEnergyFromReactors(incubator.consumption);
                }
                const larva = incubator.createLarva();
                if (larva) {
                    this.units.larvae.push(larva);
                    this.updated = true;
                }
            });
    }

    getAvailableEnergy() {
        return this.buildings.smallReactors
            .reduce((sum, reactor) => sum + reactor.energy, 0); // Дописать сюда дпроверку достигаемости
    }

    consumeEnergyFromReactors(amount) {
        let remainingAmount = amount;
        for (const reactor of this.buildings.smallReactors) {
            if (remainingAmount <= 0) break;
            const consumeEnergy = Math.min(reactor.energy, remainingAmount);
            reactor.energy -= consumeEnergy;
            remainingAmount -= consumeEnergy;
        }
    }

    updateLarvae() {
        this.units.larvae.forEach(larva => larva.update());
    }


    // 4. передвинуть рабочих
    moveWorkers() {
        this.units.workers.forEach(unit => unit.moveOneStep());
    }


    // 10. вырастить грибочки на грибнице
    myceliumGrowAll() {
        this.buildings.mycelium.forEach(mycelium => this.myceliumGrow(mycelium));
    }

    // 11. расширить грибницу
    myceliumExtendAll() {
        this.buildings.mycelium.forEach(mycelium => this.myceliumExtend(mycelium));
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
        this.myceliumGrowAll();
        // 11. расширить грибницу
        this.myceliumExtendAll();

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