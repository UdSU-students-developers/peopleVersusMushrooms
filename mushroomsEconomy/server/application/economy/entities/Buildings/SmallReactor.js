const Building = require("./Building");
const CONFIG = require("../../../../config");

const { HP, SIZE, CONSUMPTION, PRODUCTION, CAPACITY, TYPE, VISIBILITY } = CONFIG.ECONOMY.BIO_REACTOR_SMALL;

class SmallReactor extends Building {
    constructor({ guid, x, y, callbacks = {} }) {
        super({ 
            type: TYPE, 
            guid: guid, 
            x: x, 
            y: y, 
            callbacks: callbacks, 
            hp: HP, 
            size: SIZE, 
            consumption: CONSUMPTION, 
            production: PRODUCTION, 
            capacity: CAPACITY,
            visibility: VISIBILITY,
        });

        this.energy = 0;
        this.consumed = false;
    }

    get() {
        return {
            ...super.get(),
            energy: this.energy,
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
                const mc = mycelium.find(m => m.x === nx && m.y === ny && m.level >= CONFIG.ECONOMY.MYCELIUM.MAX_LEVEL);
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