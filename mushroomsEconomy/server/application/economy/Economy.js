const EasyStar = require('easystarjs');
const CONFIG = require('../../config');

const Mycelium = require('./entities/Buildings/Mycelium');
const SmallReactor = require('./entities/Buildings/SmallReactor');

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

        /* УДОЛИ МЕНЯ */
        this.addMycelium(25, 25);
        this.addSmallReactor(24, 25);

        //чтобы каждый раз не запрашивать у бд
        this.buildingsTypes = this.db.getBuildingTypes();
        this.myceliumParams = this.buildingsTypes.find(building => building.type === 'mycelium');
        this.smallReactorParams = this.buildingsTypes.find(building => building.type === 'small_reactor');
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
        }
    }


    // Методы добавления объектов

    addSmallReactor(x, y) {
        const reactorGuid = this.common.guid();
        this.buildings.push(new SmallReactor({
            guid: reactorGuid,
            x,
            y,
            params: this.smallReactorParams,
        }));
    }

    addMycelium(x, y) {
        this.mycelium.push(new Mycelium({
            x,
            y,
            guid: this.common.guid(),
            params: this.myceliumParams,
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

    reactorsConsume() {
        this.buildings
            .filter(b => b instanceof SmallReactor)
            .forEach(reactor => {
                const consumedCount = reactor.consumeMycelium(this.mycelium);
                if (consumedCount > 0) {
                    this.updated = true;
                }
            });
    }

    update() {

        //console.log(this.mycelium.length);

        /****************/
        /* про грибницу */
        // 1. вырасти грибочки
        this.mycelium.forEach(mycelium => this.myceliumGrow(mycelium));
        // 2. расширить грибницу при возможности
        this.mycelium.forEach(mycelium => this.myceliumExtend(mycelium));
        // 3. реакторы потребляют мицелий
        this.reactorsConsume();
        // 4. Переместить юнитов если нужно
        this.moveUnits();
        /****************/
        if (this.updated) {
            this.updated = false;
            this.callbacks.updated(this.get());
        }
    }
}

module.exports = Economy;