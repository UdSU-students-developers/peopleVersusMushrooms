const CONFIG = require("../../../config");

const { HP, GROW_SPEED, GROW_LEVEL_UP, MAX_LEVEL, POWER } = CONFIG.ECONOMY.MYCELIUM;

class Mycelium {
    constructor({ x, y, guid, callbacks }) {
        this.x = x;
        this.y = y;
        this.guid = guid;
        this.callbacks = callbacks;

        this.hp = HP;
        this.level = 0; // уровень выросших грибочков
        this.grow = 0; // скорость роста
        this.canGrow = true; // может ли расти грибница (не стоит ли на ней здание)
    }

    get() {
        return {
            x: this.x,
            y: this.y,
            hp: this.hp,
            level: this.level,
        }
    }

    update() {
        if (!this.canGrow) {
            return;
        }
        this.grow += GROW_SPEED;
        if (this.grow >= GROW_LEVEL_UP) {
            this.grow = 0;
            if (this.level <= MAX_LEVEL) {
                this.level += 1;
            } else {
                this.extend();
            }
        }
    }

    getPower() {
        return POWER;
    }

    // породить новую грибницу

    canExtend() {
        const freeCells = this.callbacks.checkAround(this.x, this.y);
        return freeCells.length > 0;
    }

    extend() {
        this.grow = 0;
        this.level = 0;
        const freeCells = this.callbacks.checkAround(this.x, this.y);
        if (freeCells.length === 0) return;
        const { x, y } = freeCells[Math.floor(Math.random() * freeCells.length)];
        this.callbacks.extend(x, y);
        //console.log("Вырос");
    }

}

module.exports = Mycelium; 