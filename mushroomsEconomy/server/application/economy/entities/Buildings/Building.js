const EasyStar = require('easystarjs');

class Building {
    constructor({
        type, 
        guid, 
        x, 
        y, 
        callbacks = {}, 
        hp = null, 
        size = null, 
        consumption = null, 
        production = null, 
        capacity = null, 
        visibility = null,
    }) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.guid = guid;
        this.callbacks = callbacks;

        // ОБЯЗАТЕЛЬНО заполнить по типу здания!!!
        this.hp = hp;
        this.size = size;
        this.consumption = consumption; // энергопотребление за единицу времени
        this.production = production; // сколько производит за единицу времени
        this.capacity = capacity; // емкость внутреннего хранилища
        this.visibility = visibility;

        this.easyStar = new EasyStar.js();
    }

    get() {
        return {
            x: this.x,
            y: this.y,
            type: this.type,
            size: this.size,
            visibility: this.visibility,
            hp: this.hp,
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

    async hasPathTo(grid, target) {
        return new Promise((resolve) => {
            if (!this.easyStar || !grid) {
                resolve(false);
                return;
            }
            this.easyStar.setGrid(grid);
            this.easyStar.setAcceptableTiles([1]);
            this.easyStar.findPath(this.x, this.y, target.x, target.y, (path) => {
                resolve(path !== null && path.length > 0);
            });
            this.easyStar.calculate();
        });

    }

     takeDamage(amount) {
        if (amount <= 0) return false;

        this.hp = Math.max(0, this.hp - amount);
        return this.hp === 0;
    }
}

module.exports = Building;