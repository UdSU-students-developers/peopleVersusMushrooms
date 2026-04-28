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


    //движение юнитов
    moveUnits() {
        [...this.workers].forEach(unit => unit.moveOneStep())
    }

    //создать юнита
    createPeopleUnit({x, y, unitType, barracksGuid}) {

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

    //создание трубопровода
    createPipeline({startX, startY, endX, endY}) {
        const pipelineGuid = this.common.guid();
        this.buildings.push(new Pipeline({
            guid: pipelineGuid,
            startX,
            startY,
            endX,
            endY,
            map: this.map,
            economy: this
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
            map: this.map,
            economy: this
        }));
        this.updated = true;
    }

    //проверка подключения зданий между собой трубой
    checkPipelineConnection({ giverGuid, receiverGuid, pipelineGuid}) {
        //находим трубопровод
        const pipeline = this.buildings.find(b => b.guid === pipelineGuid);
        if (!pipeline) return false;
        
        //находим здание-отправитель
        const giver = this.buildings.find(b => b.guid === giverGuid);
        if (!giver) return false;
        
        //находим здание-получатель
        const receiver = this.buildings.find(b => b.guid === receiverGuid);
        if (!receiver) return false;
        
        //проверяем, что здания подключены к трубе
        const startCoords = pipeline.getStartCoords();
        const endCoords = pipeline.getEndCoords();
        
        const isGiverValid = (giver.x === startCoords.x && giver.y === startCoords.y) ||
                             (giver.x === endCoords.x && giver.y === endCoords.y);
        const isReceiverValid = (receiver.x === startCoords.x && receiver.y === startCoords.y) ||
                                (receiver.x === endCoords.x && receiver.y === endCoords.y);
        
        if (!isGiverValid || !isReceiverValid) return false;
        
        return true;
    }

    
    //транспортировка ресурса из одного здания в другое
    transferResource({ giverGuid, receiverGuid, resourceType, amount }) {
        //находим здание-отправитель
        const giver = this.buildings.find(b => b.guid === giverGuid);
        if (!giver) return false;
        
        //находим здание-получатель
        const receiver = this.buildings.find(b => b.guid === receiverGuid);
        if (!receiver) return false;
        
        //забираем ресурс у отправителя
        const taken = giver.takeResource(resourceType, amount);
        if (taken === 0) return false;
        
        //отдаем ресурс получателю
        const added = receiver.addResource(resourceType, taken);
        if (added === 0) {
            //если не добавилось - возвращаем обратно
            giver.addResource(resourceType, taken);
            return false;
        }
        
        this.updated = true;
        return true;
    }

    

    update() {
        //переместить юнитов
        this.moveUnits();

        if (this.updated) {
            this.updated = false;
            this.callbacks.updated(this.get());
        }
    }
    
}

module.exports = Economy;