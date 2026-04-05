class Building {
    constructor({type, guid, x, y, callbacks = {}}) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.guid = guid;
        this.callbacks = callbacks;

        // ОБЯЗАТЕЛЬНО заполнить по типу здания!!!
        this.hp = null;
        this.size = null;
        this.consumption = null; // энергопотребление за единицу времени
        this.production = null; // сколько производит за единицу времени
        this.capacity = null; // емкость внутреннего хранилища
    }

    get() {
        return {
            guid: this.guid,
            x: this.x,
            y: this.y,
            type: this.type,
            hp: this.hp,
            size: this.size,
        }
    }

    getSelf() {
        return {
            ...this.get(),
            consumption: this.consumption,
            production: this.production,
            capacity: this.capacity,
        }
    }

    getProduction() {
        return this.production;
    }

    getConsumption() {
        return this.consumption;
    }

    getCapacity() {
        return this.capacity;
    }
}

module.exports = Building;