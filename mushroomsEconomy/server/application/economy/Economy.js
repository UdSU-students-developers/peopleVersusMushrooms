//GLOBAL
const GLOBAL_CONFIG = require('../../../../global/globalConfig');

//LOCAL
const CONFIG = require('../../config');
const EasyStar = require('easystarjs');

const Mycelium = require('./entities/Buildings/Mycelium');
const SmallReactor = require('./entities/Buildings/SmallReactor');
const Reactor = require('./entities/Buildings/Reactor');
const Incubator = require('./entities/Buildings/Incubator');
const Worker = require('./entities/Unit/Worker');
const Mine = require('./entities/Buildings/Mine');
const Larva = require('./entities/Unit/Larva');
const Map = require('./entities/Map/Map');

const Autopilot = require("./Autopilot");

const { INTERVAL } = GLOBAL_CONFIG;

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

        this.resources = {
            iron: 110,
            energy: 0,
        };

        //Здания
        this.buildings = {
            reactors: [], //реакторы (малые и большие)
            incubators: [], // инкубаотры
            mycelium: [], // грибы
            mines: [], // шахты
        };

        this.updatedBuildings = []; //ПРИ добавлении или удалении здания добавить в этот массив его гуид

        //Юниты всякие
        this.units = {
            workers: [], // рабочие
            larvae: [],  // личинки
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
        };
        Object.keys(guids).forEach(key => this.guids[key] = guids[key]);

        this.map = new Map();
        this._initBuildings(startPoint);

        // start game proccess
        this.spawnArmyUnit({ armyGuid: guids.mushroomsArmy, type: GLOBAL_CONFIG.UNIT_TYPES.MUSHROOMS_ARMY.CHAMPIGNEB, x: 4, y: 4 });

        this.updated = false;
        this.autopilot = new Autopilot();
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
            resources: { ...this.resources },
            units: {
                larvae: this.units.larvae.map(l => l.get()),
                workers: this.units.workers.map(g => g.get()),
            },
            buildings: {
                reactors: this.buildings.reactors.map(r => r.get()),
                incubators: this.buildings.incubators.map(i => i.get()),
                mycelium: this.buildings.mycelium.map(m => m.get()),
                mines: this.buildings.mines.map(m => m.get()),
            },
            enemyBuildings: this.enemyBuildings,
            map: this.map.get(),
            //updatedBuildings: this.getUpdatedBuildings(),
        };
    }

    setRelief(relief) {
        this.map.setRelief(relief);
    }

    setResources(resources) {
        //console.log("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n", resources)
        this.map.setResources(resources);
    }

    setVisibility({ units = [], buildings = [] }) {
        console.log("\n\n\n\n\n\n\n", buildings)
        for (const building of buildings) {
            const existingIndex = this.enemyBuildings.findIndex(b => b.guid === building.guid);
            if (existingIndex !== -1) {
                this.enemyBuildings[existingIndex] = building;
            } else {
                this.enemyBuildings.push(building);
            }
        }
    }

    // Методы добавления объектов

    addLarva(x, y, homeX, homeY) {
        const larva = new Larva({
            x,
            y,
            homeX,
            homeY,
            guid: this.common.guid(),
            map: this.map.larvaGrid,
            callbacks: {
                mutateToWorker: (lar) => this.mutateLarvaToWorker(lar),
            },
        });
        this.units.larvae.push(larva);
        this.updatedUnits.push(larva.get());
    }

    mutateLarvaToWorker(lar) {
        const { MUTATION_ENERGY_COST } = CONFIG.ECONOMY.LARVA;
        if (this.resources.energy < MUTATION_ENERGY_COST) return;

        this.resources.energy -= MUTATION_ENERGY_COST;
        this.updatedUnits.push(lar.get());
        this.units.larvae = this.units.larvae.filter(l => l.guid !== lar.guid);

        this.addWorker(lar.x, lar.y);
    }

    addWorker(x, y) {
        const worker = new Worker({
            x,
            y,
            guid: this.common.guid(),
            map: this.map.larvaGrid,
            callbacks: {
                getResources: () => this.map.resources,
                getBuildings: () => Object.values(this.buildings).flat(),
                mutateToMine: (wor) => this.mutateWorkerToMine(wor),
            },
        });
        this.units.workers.push(worker);
        this.updatedUnits.push(worker.get());
    }

    mutateWorkerToMine(wor) {
        const mineCost = CONFIG.ECONOMY.MINE.IRON_COST;
        if (this.resources.iron < mineCost) return;

        this.resources.iron -= mineCost;
        this._removeWorker(wor);
        this.addMine(wor.x, wor.y);
    }

    mutateWorkerToReactor(wor) {
        this._removeWorker(wor);
        this.addReactor(wor.x, wor.y);
    }

    mutateWorkerToSmallReactor(wor) {
        this._removeWorker(wor);
        this.addSmallReactor(wor.x, wor.y);
    }

    mutateWorkerToIncubator(wor) {
        this._removeWorker(wor);
        this.addIncubator(wor.x, wor.y);
    }

    _removeWorker(wor) {
        this.updatedUnits.push(wor.get());
        this.units.workers = this.units.workers.filter(w => w.guid !== wor.guid);
    }

    _pushUpdatedBuilding(guid) {
        this.updatedBuildings.push(this.findEntityByGuid(guid).get());
        this.updated = true;
    }

    addMine(x, y) {
        const guid = this.common.guid();
        this.buildings.mines.push(new Mine({
            guid,
            x,
            y,
            callbacks: {
                getResources: () => this.map.resources,
            },
        }));
        this._pushUpdatedBuilding(guid);
    }

    addSmallReactor(x, y) {
        const guid = this.common.guid();
        this.buildings.reactors.push(new SmallReactor({
            type: CONFIG.ECONOMY.BIO_REACTOR_SMALL.TYPE,
            guid,
            x,
            y,
        }));
        this._pushUpdatedBuilding(guid);
    }

    addReactor(x, y) {
        const guid = this.common.guid();
        this.buildings.reactors.push(new Reactor({ guid, x, y }));
        this._pushUpdatedBuilding(guid);
    }

    addIncubator(x, y) {
        const guid = this.common.guid();
        this.buildings.incubators.push(new Incubator({
            guid,
            x,
            y,
            callbacks: {
                getMap: () => this.map.relief,
                addLarva: (lx, ly, homeX, homeY) => this.addLarva(lx, ly, homeX, homeY),
                getBuildings: () => [
                    ...this.buildings.reactors,
                    ...this.buildings.incubators,
                ],
            },
        }));
        this._pushUpdatedBuilding(guid);
    }

    addMycelium(x, y) {
        const guid = this.common.guid();
        this.buildings.mycelium.push(new Mycelium({
            x,
            y,
            guid,
            callbacks: {},
        }));
        this._pushUpdatedBuilding(guid);
    }

    getUpdatedBuildings() {
        const result = this.updatedBuildings;
        this.updatedBuildings = [];
        return result;
    }

    getUpdatedUnits() {
        const result = this.updatedUnits;
        this.updatedUnits = [];
        return result;
    }

    // 3. передать боевых юнитов в армию (callback)
    spawnArmyUnit(unitData) { //Получаются из личинок
        this.callbacks.spawnArmyUnit(unitData);
    }

    getAvailableEnergy() {
        let total = 0;
        for (const reactor of this.buildings.reactors) {
            for (const incubator of this.buildings.incubators) {
                if (this.checkConnection(reactor, incubator)) {
                    total += reactor.energy;
                    break;
                }
            }
        }
        return total;
    }

    consumeEnergyFromReactors(amount) {
        let remaining = amount;
        for (const reactor of this.buildings.reactors) {
            if (remaining <= 0) break;
            const consume = Math.min(reactor.energy, remaining);
            reactor.energy -= consume;
            remaining -= consume;
        }
    }

    checkConnection(building1, building2) {
        if (!this.map.myceliumGrid || !building1 || !building2) return false;
        return building1.hasPathTo(this.map.myceliumGrid, { x: building2.x, y: building2.y });
    }

    reactorsConsume() {
        this.buildings.reactors.forEach(reactor => {
            const consumed = reactor.consumeMycelium(this.buildings.mycelium);
            if (consumed > 0) {
                this.resources.energy += consumed;
                this.updated = true;
            }
        });
    }

    // 8. породить личинок (потратить немного железа и немного энергии)
    incubatorProduce() {
        const now = Date.now();
        for (const incubator of this.buildings.incubators) {
            const result = incubator.createLarvae({ availableEnergy: this.resources.energy, now });
            if (!result) continue;
            this.resources.energy -= result.energySpent;
            this.updated = true;
        }
    }

    // 1. вырасти грибочки
    myceliumGrowAll() {
        this.buildings.mycelium.forEach(mycelium => {
            if (mycelium.update()) this.updated = true;
        });
    }

    // 2. расширить грибницу при возможности
    myceliumExtendAll() {
        this.buildings.mycelium.forEach(mycelium => {
            const freeCells = mycelium.canExtend(this.map.relief, this.buildings.mycelium, this.buildings, this.enemyBuildings);
            if (!freeCells.length) return;

            const result = mycelium.extend(freeCells);
            if (!result) return;

            this.addMycelium(result.x, result.y);
            this.updated = true;
        });
    }

    updateUnits() {
        const grid = this.map.larvaGrid;
        if (!grid) return;

        const allUnits = [
            ...this.units.larvae,
            ...this.units.workers,
        ];

        for (const larva of this.units.larvae) {
            larva.setGrid(grid);
            larva.setUnits(allUnits);
            larva.update();
        }

        for (const worker of this.units.workers) {
            worker.setGrid(grid);
            worker.setUnits(allUnits);
            worker.update();
        }
    }

    updateMines() {
        for (const mine of this.buildings.mines) {
            const extracted = mine.extractIron();
            if (extracted > 0) {
                this.resources.iron += extracted;
                this.updated = true;
            }
        }
    }

    findEntityByGuid(guid) {
        for (const group of Object.values(this.units)) {
            const found = group.find(u => u.guid === guid);
            if (found) return found;
        }
        for (const group of Object.values(this.buildings)) {
            const found = group.find(b => b.guid === guid);
            if (found) return found;
        }
        return null;
    }

    _destroyEntity(guid) {
        for (const [key, group] of Object.entries(this.units)) {
            const idx = group.findIndex(u => u.guid === guid);
            if (idx !== -1) {
                this.updatedUnits.push({ ...group[idx].get(), destroyed: true });
                this.units[key].splice(idx, 1);
                return;
            }
        }
        for (const [key, group] of Object.entries(this.buildings)) {
            const idx = group.findIndex(b => b.guid === guid);
            if (idx !== -1) {
                this.updatedBuildings.push({ ...group[idx].get(), destroyed: true });
                this.buildings[key].splice(idx, 1);
                return;
            }
        }
    }

    applyDamage(guid, damage) {
        const entity = this.findEntityByGuid(guid);
        if (!entity) return false;
        const isDead = entity.takeDamage(damage);
        this.updated = true;
        if (isDead) {
            this._destroyEntity(guid);
        }
        return true;
    }

    moveUnitToNearestCell(guid) {
        const unit = [...this.units.larvae, ...this.units.workers].find(u => u.guid === guid);
        if (!unit) return false;
        if (!unit.grid) return false;

        const cells = unit.findNearestCell();
        if (!cells.length) return false;

        const target = cells[Math.floor(Math.random() * cells.length)];
        unit.setTarget(target.x, target.y);
        this.updated = true;
        return true;
    }

    _initBuildings(startPoint = { x: 94, y: 94 }) {
        // создать инкубатор
        this.addIncubator(startPoint.x, startPoint.y);
        // создать маленький реактор
        this.addSmallReactor(startPoint.x + 1, startPoint.y + 1);
        // создать грибничку
        this.addMycelium(startPoint.x - 1, startPoint.y - 1);
        this.addMycelium(1, 1);
        //this.addReactor(startPoint.x + 3, startPoint.y + 3);
        //this.addWorker(startPoint.x-10, startPoint.y)
        this.updated = true;
    }

    update() {
        this.map.updateMyceliumGrid(this.buildings.mycelium);
        this.map.updateLarvaGrid(this.buildings);
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

        // 4. шахты добывают железо
        this.updateMines();

        this.autopilot.update(this);

        // отбросить апдейт, если он случился
        if (this.updated) {
            this.updated = false;
            this.callbacks.updated(this.get());
        }
    }
}

module.exports = Economy;