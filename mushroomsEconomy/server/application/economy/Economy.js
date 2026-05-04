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
        callbacks: { updated, spawnArmyUnit },
        guids,
        startPoint,
    }) {
        this.guid = guids.mushroomsEconomy; // совпадает с guid игрока
        this.db = db;
        this.common = common;
        this.callbacks = { updated, spawnArmyUnit };
        // данные экономики
        this.resourceMap; // массив известных ресурсов [{x, y, value}]
        this.relief = null;
        this.lastUpdateTime = Date.now();

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

        this.myceliumGrid = null;
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

    setRelief(relief) {
        this.relief = relief;
        this.buildGridFromRelief();
    }

    buildGridFromRelief() {
        if (!this.relief) return;

        this.map = this.relief.map(row =>
            row.map(tile => {
                if (tile === null) return 3;
                return tile;
            })
        );

        const allUnits = [
            ...this.units.workers,
            ...this.units.larvae
        ];

        allUnits.forEach(u => u.setMap(this.map));
    }

    setResources(resources) {
        this.resourceMap = resources;
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
        if (!startPoint) {startPoint = {x: 3, y: 3}};
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

    // 3. передать боевых юнитов в армию (callback)
    spawnArmyUnit(unitData) { //Получаются из личинок
        this.callbacks.spawnArmyUnit(unitData);
    }

    reactorsConsume() {
        this.buildings.smallReactors
            .forEach(reactor => {
                const reachableMycelium = this.buildings.mycelium.filter(mc => this.checkConnection(reactor, mc));
                reactor.getConsumable(reachableMycelium).forEach(mc => mc.consume());
            });
    }

    setPathsUnits({ x, y }) {
        //пометка что надо будет сделать массив с юнитами общий
        [...this.units.workers].forEach(unit => unit.calcPath({ x, y }));
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

    updateLarvae() {
        this.units.larvae.forEach(larva => larva.update());
    }

    updateMyceliumGrid() {
        this.myceliumGrid = Array(50).fill().map(() => Array(50).fill(0));

        for (const mc of this.buildings.mycelium) {
            if (mc.x >= 0 && mc.x < 50 && mc.y >= 0 && mc.y < 50) {
                this.myceliumGrid[mc.y][mc.x] = 1;
            }
        }
    }

    async checkConnection(building1, building2) {
        if (!this.myceliumGrid || !building1 || !building2) return false;
        return await building1.hasPathTo(this.myceliumGrid, {x:building2.x, y:building2.y});
    }


    updateUnits(deltaTime) {
        const allUnits = [
            ...this.units.workers,
            ...this.units.larvae
        ];

        allUnits.forEach(unit => unit.update(deltaTime));
    }

    // 8. породить личинок (потратить немного железа и немного энергии)
    produceLarvae() {
        const availableEnergy = this.getAvailableEnergy();

        for (const incubator of this.buildings.incubators) {
            if (!incubator.isCreating()) {
                const started = incubator.startCreating();
                if (started) {
                    this.updated = true;
                }
            }

            if (incubator.isCreating && incubator.updateLarvaProgress(availableEnergy)) {
                this.updated = true;
                // Логика потребления энергии
            }

            const larva = incubator.createLarva();
            if (larva) {
                this.units.larvae.push(larva);
                this.updated = true;
            }
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

    update() {
        this.updateMyceliumGrid();
        // 1. Мутировать юнита из личинки (потратить железо)
        // 2. Мутировать здание из рабочего (потратить железо)
        // 3. передать боевых юнитов в армию (callback)
        // 3.5. для рабочих определить цели и задачи

        const now = Date.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;
        this.updateUnits(deltaTime);
        // 5. передвинуть личинки
        // 6. добыть энергию (сожрать грибочки)
        // 7. добыть железо (потратить энергию) и распределить их в инкубаторы, шахты или бочки для железа
        // 8. породить личинок (потратить немного железа и немного энергии)
        this.produceLarvae();
        // 9. остаток непотраченной энергии (жир) распределить по бочкам для жира
        // 10. вырастить грибочки на грибнице
        this.myceliumGrowAll();
        // 11. расширить грибницу
        this.myceliumExtendAll();

        /*
        // 3. реакторы потребляют мицелий
        this.reactorsConsume();
        */

        // отбросить апдейт, если он случился
        if (this.updated) {
            this.updated = false;
            this.callbacks.updated(this.get());
        }
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
}

module.exports = Economy;