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
    //PS: если все же эти методы не будут отличаться, засунуть в один createBuilding 
    //создание трубы
    createPipe({x, y}) {
        const pipeGuid = this.common.guid();
        this.buildings.push(new Pipe({
            guid: pipeGuid,
            x,
            y,
        }));
        this.updated = true;
    }

    //создание казармы
    createBarracks({x, y}) {
        const barracksGuid = this.common.guid();
        this.buildings.push(new Barracks({
            guid: barracksGuid,
            x,
            y,
        }));
        this.updated = true;
    }

    //создание малого генератора
    createSmallGenerator({x, y}) {
        const generatorGuid = this.common.guid();
        this.buildings.push(new SmallGenerator({
            guid: generatorGuid,
            x,
            y,
        }));
        this.updated = true;
    }

    //создание буровой установки
    createDriller({x, y}) {
        const drillerGuid = this.common.guid();
        this.buildings.push(new Driller({
            guid: drillerGuid,
            x,
            y,
        }));
        this.updated = true;
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
        this.workers.forEach(unit => unit.moveOneStep())
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