const Building = require('./Building');

class DieselGenerator extends Building {
    constructor({ type, guid, x, y, callbacks = {} }) {
        super({
            type,
            guid,
            x,
            y,
            callbacks,
            hp: 100,
            size: 2,
            production: 50,      // производство электричества
            consumption: 10,     // потребление нефти
            capacity: 200        // емкость хранилища электричества
        });
        
        //внутреннее хранилище нефти
        this.oilStorage = 0;
        this.oilCapacity = 100;

        //внутреннее хранилище электричества
        this.electricityStorage = 0;
        
        //работает ли генератор
        this.isActive = false;
    }

    get() {
        return {
            ...super.get(),
            isActive: this.isActive
        };
    }

    getSelf() {
        return {
            ...super.getSelf(),
            oilStorage: this.oilStorage,
            oilCapacity: this.oilCapacity,
            isActive: this.isActive
        };
    }

    //добавить нефть
    addOil(amount) {
        const availableSpace = this.oilCapacity - this.oilStorage;
        const added = Math.min(amount, availableSpace);
        this.oilStorage += added;
        
        if (this.callbacks.onOilAdded) {
            this.callbacks.onOilAdded(this.guid, added);
        }
        
        return added;
    }

    //забрать электричество
    takeElectricity(amount) {
        const taken = Math.min(amount, this.electricityStorage);
        this.electricityStorage -= taken;
        
        if (this.callbacks.onElectricityTaken) {
            this.callbacks.onElectricityTaken(this.guid, taken);
        }
        
        return taken;
    }

    //получить текущий запас нефти
    getOilStorage() {
        return this.oilStorage;
    }

    //получить потребление нефти
    getOilConsumption() {
        return this.consumption;
    }

    //получить емкость хранилища нефти
    getOilCapacity() {
        return this.oilCapacity;
    }
    
    //получить производство электричества
    getElectricityProduction() {
        return this.production;
    }

    //получить емкость хранилища электричества
    getElectricityCapacity() {
        return this.capacity;
    }

    //получить текущий запас электричества
    getElectricityStorage() {
        return this.electricityStorage;
    }

    update() {

    }
}

module.exports = DieselGenerator;