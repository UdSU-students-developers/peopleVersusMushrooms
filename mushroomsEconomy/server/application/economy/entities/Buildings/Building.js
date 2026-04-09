class Building {
    constructor({params, guid, x, y, callbacks = {}}) {
        this.x = x;
        this.y = y;
        this.type = params.type;
        this.guid = guid;
        this.callbacks = callbacks;

        // ОБЯЗАТЕЛЬНО заполнить по типу здания!!!
        this.hp = params.hp;
        this.size = params.size;
        this.consumption = params.consumption; // энергопотребление за единицу времени
        this.production = params.production; // сколько производит за единицу времени
        this.capacity = params.capacity; // емкость внутреннего хранилища
    }

    get() {
        return {
            guid: this.guid,
            coords: {x: this.x, y: this.y },
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