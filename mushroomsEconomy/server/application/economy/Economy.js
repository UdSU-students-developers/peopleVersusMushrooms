//GLOBAL
const GLOBAL_CONFIG = require('../../../../global/globalConfig');

//LOCAL
const EasyStar = require('easystarjs');
const CONFIG = require('../../config');

const Mycelium = require('./entities/Buildings/Mycelium');
const SmallReactor = require('./entities/Buildings/SmallReactor');
const Incubator = require('./entities/Buildings/Incubator');
const Larva = require('./entities/Unit/Larva')

const Map = require('./entities/Map/Map');

const { INTERVAL, MAP_SIZE } = GLOBAL_CONFIG;

class Economy {
    constructor({
        db,
        common,
        callbacks: { updated, spawnArmyUnit },
        guids,
        startPoint,
    }) {
        this.guid = guids.mushroomsEconomy; // совпадает с guid игрока
        this.db = db;
        this.common = common;
        this.callbacks = { updated, spawnArmyUnit };
        // данные экономики
        this.lastUpdateTime = Date.now();

        //Здания
        this.buildings = {
            smallReactors: [],// малые реакторы 
            incubators: [], //инкубаторы
            mycelium: [], // грибница
        };

        this.updatedBuildings = []; //ПРИ добавлении или удалении здания добавить в этот массив его гуид

        //Юниты всякие
        this.units = {
            workers: [], //рабочие
            larvae: [], //личинки
        };

        this.updatedUnits = [];

        // данные про врагов
        this.enemyBuildings = [];

        // данные про игроков
        this.guids = {
            spectator: null,
            peopleArmy: null,
            peopleEconomy: null,
            mushroomsArmy: null,
            mushroomsEconomy: null,
            mapGuid: null,
        }
        Object.keys(guids).forEach(key => this.guids[key] = guids[key]);

        this.map = new Map();
        this._initBuildings(startPoint);

        // start game proccess
        this.spawnArmyUnit({armyGuid: guids.mushroomsArmy, type: GLOBAL_CONFIG.UNIT_TYPES.MUSHROOMS_ARMY.CHAMPIGNEB, x: 4, y: 4 });
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
            guids: this.guids,
            buildings: {
                smallReactors: this.buildings.smallReactors.map(r => r.get()),
                incubators: this.buildings.incubators.map(i => i.get()),
                mycelium: this.buildings.mycelium.map(m => m.get()),
            },
            units: {
                larvae: this.units.larvae.map(l => l.get()),
            },
            map: this.map.get(),
            //updatedBuildings: this.getUpdatedBuildings(),
        }
    }

    setRelief(relief) {
        this.map.setRelief(relief);
    }

    _initBuildings(startPoint) {
        if (!startPoint) {startPoint = {x: 3, y: 3}};
        // создать инкубатор
        this.addIncubator(startPoint.x, startPoint.y);
        // создать маленький реактор
        this.addSmallReactor(startPoint.x + 1, startPoint.y + 1);
        // создать грибничку
        this.addMycelium(startPoint.x - 1, startPoint.y - 1)
        this.updated = true;
    }

    addLarva(x, y, homeX, homeY) {
        const larvaGuid = this.common.guid();
        const larva = new Larva({
            x: x,
            y: y,
            homeX: homeX,
            homeY: homeY,
            guid: larvaGuid,
            map: this.map.larvaGrid || this.map.relief,
        });
        this.units.larvae.push(larva);
        this.updatedUnits.push(larva.get());
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
        this.updatedBuildings.push(this.findEntityByGuid(reactorGuid).get());
    }

    addIncubator(x, y) {
        const incubatorGuid = this.common.guid();
        this.buildings.incubators.push(new Incubator({
            guid: incubatorGuid,
            x,
            y,
            callbacks: {
                getMap: () => this.map.relief,
                addLarva: (lx, ly, homeX, homeY) => this.addLarva(lx, ly, homeX, homeY),
            },
        }));
        this.updatedBuildings.push(this.findEntityByGuid(incubatorGuid).get());
    }

    addMycelium(x, y) {
        const myceliumGuid = this.common.guid();
        this.buildings.mycelium.push(new Mycelium({
            x,
            y,
            guid: myceliumGuid,
            callbacks: {},
        }));
        this.updatedBuildings.push(this.findEntityByGuid(myceliumGuid).get());
    }

    getUpdatedBuildings() {
        const updateBuildings = this.updatedBuildings;
        this.updatedBuildings = [];
        return updateBuildings;
    }

    getUpdatedUnits() {
        const updateUnits = this.updatedUnits;
        this.updatedUnits = [];
        return updateUnits;
    }

    // 1. вырасти грибочки
    myceliumGrow(mycelium) {
        if (mycelium.update()) {
            this.updated = true;
        }
    }

    // 2. расширить грибницу при возможности
    myceliumExtend(mycelium) {
        const relief = this.map.relief;
        const freeCells = mycelium.canExtend(relief, this.buildings.mycelium, this.buildings, this.enemyBuildings);
        if (!freeCells.length) return;

        const result = mycelium.extend(freeCells);
        if (!result) return;

        this.addMycelium(result.x, result.y);
        this.updated = true;
    }

    // 3. передать боевых юнитов в армию (callback)
    spawnArmyUnit(unitData) { //Получаются из личинок
        this.callbacks.spawnArmyUnit(unitData);
    }

    reactorsConsume() {
        this.buildings.smallReactors.forEach(reactor => {
            const consumed = reactor.consumeMycelium(this.buildings.mycelium);
            if (consumed > 0) this.updated = true;
        });
    }

    getAvailableEnergy() {
        let totalEnergy = 0;
        for (const reactor of this.buildings.smallReactors) {
            for (const incubator of this.buildings.incubators) {
                if (this.checkConnection(reactor, incubator)) {
                    totalEnergy += reactor.energy;
                    break;
                }
            }
        }
        return totalEnergy;
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

    checkConnection(building1, building2) {
        if (!this.map.myceliumGrid || !building1 || !building2) return false;
        return building1.hasPathTo(this.map.myceliumGrid, { x: building2.x, y: building2.y });
    }

    updateUnits() {
        if (this.map.larvaGrid) {
            this.units.larvae.forEach(larva => larva.setMap(this.map.larvaGrid));
        }
        this.units.workers.forEach(unit => unit.update());
        this.units.larvae.forEach(unit => unit.update());
    }

    // 8. породить личинок (потратить немного железа и немного энергии)
    incubatorProduce() {
        if (!this.buildings.incubators.length) return;

        const now = Date.now();

        for (const incubator of this.buildings.incubators) {
            const availableEnergy = this.getAvailableEnergy();
            const createResult = incubator.createLarvae({ availableEnergy, now });

            if (!createResult) continue;

            this.consumeEnergyFromReactors(createResult.energySpent);
            this.updated = true;
        }
    }

    // 10. вырастить грибочки на грибнице
    myceliumGrowAll() {
        this.buildings.mycelium.forEach(mycelium => this.myceliumGrow(mycelium));
    }

    // 11. расширить грибницу
    myceliumExtendAll() {
        this.buildings.mycelium.forEach(mycelium => this.myceliumExtend(mycelium));
    }

    findEntityByGuid(guid) {
        for (const type of Object.values(this.units)) {
            const found = type.find(u => u.guid === guid);
            if (found) return found;
        }

        for (const type of Object.values(this.buildings)) {
            const found = type.find(b => b.guid === guid);
            if (found) return found;
        }

        return null;
    }

    applyDamage(guid, damage) {
        const entity = this.findEntityByGuid(guid);
        if (!entity) return false;
        entity.takeDamage(damage);
        this.updated = true;
        return true;
    }

    update() {
        this.map.updateMyceliumGrid(this.buildings.mycelium);
        this.map.updateLarvaGrid(this.buildings.mycelium);
        // 1. Мутировать юнита из личинки (потратить железо)
        // 2. Мутировать здание из рабочего (потратить железо)
        // 3. передать боевых юнитов в армию (callback)
        // 3.5. для рабочих определить цели и задачи
        
        this.updateUnits();
        // 5. передвинуть личинки
        // 6. добыть энергию (сожрать грибочки)
        // 7. добыть железо (потратить энергию) и распределить их в инкубаторы, шахты или бочки для железа
        // 8. породить личинок (потратить немного железа и немного энергии)
        this.incubatorProduce();
        // 9. остаток непотраченной энергии (жир) распределить по бочкам для жира
        // 10. вырастить грибочки на грибнице
        this.myceliumGrowAll();
        // 11. расширить грибницу
        this.myceliumExtendAll();

        
        // 3. реакторы потребляют мицелий
        this.reactorsConsume();
        
       
        // отбросить апдейт, если он случился
        if (this.updated) {
            this.updated = false;
            this.callbacks.updated(this.get());
        }
    }
}

module.exports = Economy;