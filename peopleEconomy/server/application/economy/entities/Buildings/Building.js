class Building {
    constructor({type, guid, x, y, callbacks = {}, hp = null, size = null, consumption = null, production = null, capacity = null}) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.guid = guid;
        this.callbacks = callbacks;

        this.hp = hp;
        this.size = size;
        this.consumption = consumption; // энергопотребление за единицу времени
        this.production = production; // сколько производит за единицу времени
        this.capacity = capacity; // максимальная емкость внутреннего хранилища


        this.resourceAmount = 0; //хранилище ресурсов
    }

    get() {
        return {
            guid: this.guid,
            coords: {x: this.x, y: this.y },
            type: this.type,
            hp: this.hp,
            size: this.size,
            resourceAmount: this.resourceAmount,
        }
    }

    getSelf() {
        return {
            ...this.get(),
            consumption: this.consumption,
            production: this.production,
            capacity: this.capacity,
            resourceAmount: this.resourceAmount,
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

    //добавить ресурс
    addResource(amount) {
        const added = Math.min(amount, this.capacity - this.resourcesAmount);
        this.resourcesAmount += added;
        //возвращает сколько добавилось
        return added;
    }

    //забрать ресурс
    takeResource(amount) {
        const taken = Math.min(amount, this.resourcesAmount);
        this.resourcesAmount -= taken;
        //возвращает сколько забрали
        return taken;
    }

    //уничтожить здание ?? (переопределять у труб, вопрос)
    destroy() {
        if (this.callbacks.onDestroy) {
            this.callbacks.onDestroy(this.guid);
        }
    }
}

module.exports = Building;