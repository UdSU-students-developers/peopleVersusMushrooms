const Building = require("./Building");
const CONFIG = require("../../../../config");

class SmallReactor extends Building {
    constructor(props) {
        super(props);
        const { params, x, y } = props;
        this.type = params.type;
        this.size = params.size;
        this.capacity = params.capacity;
        this.x = x;
        this.y = y;
        this.energy = 0;
    }

    get() {
        return {
            ...super.get(),
            energy: this.energy,
            type: this.type,
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

        for (const mc of consumableList) {
            const energyGain = mc.getPower();
            this.energy = Math.min(this.energy + energyGain, this.capacity);
            mc.consume();
        }

        return consumableList.length;
    }
}

module.exports = SmallReactor;