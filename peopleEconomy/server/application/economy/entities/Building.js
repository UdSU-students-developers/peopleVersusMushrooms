const Entity = require("./Entity");

class Building extends Entity {
    constructor({ 
        guid, x, y, type, hp, visibility, priority, callbacks = {},
        size = null, consumption = null, production = null, capacity = null 
    }) {
        super({ guid, x, y, callbacks: {}, type, hp, visibility })

        this.size = size;
        this.is_walkable = false;
        this.is_working = false;
        this.priority = null;

        this.consumption = consumption; // энергопотребление (топливо) за единицу времени
        this.production = production; // выработка ресурса за единицу времени (число)
        this.store = {
            OIL: 0,
            IRON: 0,
            ENERGY: 0
        }
        this.capacity = { // максимальная емкость внутреннего хранилища
            OIL: capacity.oil,
            IRON: capacity.iron
        };
    }


    getForMap() {
        return {
            ...super.getForMap(),
            size: this.size
        };
    }

    get() {
        return {
            ...super.get(),
            size: this.size
        };
    }

    getSelf() {
        return {
            ...this.get(),
            capacity: this.capacity,
            store: this.store,
            consumption: this.consumption
        };
    }

    getCapacity() {
        return this.capacity;
    }

    getConsumption() {
        return this.consumption;
    }

    // потребить энергию/нефть и перейти в рабочий режим
    consume(key) {
        if (this.consume[key] > this.store[key]) return;
        this.store[key] -= this.consume[key];
        this.is_working = true;
    }
    // произвести энергию/железо/нефть
    produce(key) {
        if (!this.is_working) return;
        this.store[key] += this.production;
        this.is_working = false;
    }
}

module.exports = Building;