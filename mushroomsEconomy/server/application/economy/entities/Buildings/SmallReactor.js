const Building = require("./Building");
const CONFIG = require("../../../../config");

const { HP, SIZE, CONSUMPTION, PRODUCTION, CAPACITY, TYPE, VISIBILITY, CONSUME_RADIUS } = CONFIG.ECONOMY.BIO_REACTOR_SMALL;

class SmallReactor extends Building {
    constructor({ guid, x, y, callbacks = {} }) {
        super({ 
            guid: guid, 
            x: x, 
            y: y, 
            callbacks: callbacks, 
            type: TYPE, 
            hp: HP, 
            size: SIZE, 
            consumption: CONSUMPTION, 
            production: PRODUCTION, 
            capacity: CAPACITY,
            visibility: VISIBILITY,
        });
        
        this.consumeRadius = CONSUME_RADIUS;
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

    getConsumable(mycelium) {
        const r = this.consumeRadius;
        const result = [];
        for (let dx = -r; dx < this.size + r; dx++) {
            for (let dy = -r; dy < this.size + r; dy++) {
                // пропуск клеток самого реактора
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