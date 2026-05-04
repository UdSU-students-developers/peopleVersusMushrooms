const Building = require("./Building");

class SmallReactor extends Building {
    constructor({ guid, x, y, callbacks = {}, options, myceliumMaxLevel }) {

        this.options = options.options;

        this.hp = this.options.hp;
        this.size = this.options.size;
        this.consumption = this.options.consumption;
        this.production = this.options.production;
        this.capacity = this.options.capacity;
        this.type = this.options.type;

        this.myceliumMaxLevel = myceliumMaxLevel;

        super({ type:this.type, guid, x, y, callbacks, hp: this.hp, size: this.size, consumption: this.consumption, production: this.production, capacity: this.capacity });

        this.energy = 0;
        this.consumed = false;
    }

    get() {
        return {
            ...super.get(),
            energy: this.energy,
            type: this.type,
            consumed: this.consumed,
        };
    }

    // возвращает мицелии рядом с реактором, готовые к потреблению
    getConsumable(mycelium) {
        const result = [];
        for (let dx = -1; dx <= this.size; dx++) {
            for (let dy = -1; dy <= this.size; dy++) {
                if (dx >= 0 && dx < this.size && dy >= 0 && dy < this.size) continue;
                const nx = this.x + dx;
                const ny = this.y + dy;
                const mc = mycelium.find(m => m.x === nx && m.y === ny && m.level >= this.myceliumMaxLevel);
                if (mc) result.push(mc);
            }
        }
        return result;
    }

    consumeMycelium(mycelium) {
        const consumableList = this.getConsumable(mycelium);

        if (consumableList.length > 0) {
            this.consumed = true;
        } else {
            this.consumed = false;
        }

        for (const mc of consumableList) {
            const energyGain = mc.getPower();
            this.energy = Math.min(this.energy + energyGain, this.capacity);
            mc.consume();
        }

        return consumableList.length;
    }

    consumeMushroom(mycelium) {
        const consumed = this.consumeMycelium(mycelium);
        this.consumed = consumed > 0;
        return this.consumed;
    }
}

module.exports = SmallReactor;