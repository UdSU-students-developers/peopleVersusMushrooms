const CONFIG = require("../../../config");

const { HP, GROW_SPEED, GROW_LEVEL_UP, MAX_LEVEL, POWER } = CONFIG.ECONOMY.MYCELIUM;

class Mycelium {
    constructor({ x, y, guid, callbacks: { } }) {
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
        
    }

    update() {
        if (!this.canGrow) {
            return;
        }
        this.grow += GROW_SPEED;
        if (this.grow >= GROW_LEVEL_UP) {
            this.grow = 0;
            this.level += 1;
            this.level = this.level >= MAX_LEVEL ? MAX_LEVEL : this.level;
        }
    }

    getPower() {
        return POWER;
    }

    // породить новую грибницу

    canExtend() {
        //...
        // здесь надо знать карту, здания, юниты, и... ВРАЖЕСКИЕ здания, и =)
        // map
        // buildings
        // this.mycelium
        // enemy buildings
    }

    extend() {
        this.grow = 0;
        this.level = 0;
        // получить точку (x, y), в которой можно вырасти
        this.callbacks.extend(x, y);
    }

}

module.exports = Mycelium;