const CONFIG = require("../../../../config");
const Building = require("./Building");

const { DIRECTIONS } = CONFIG.ECONOMY;

const { 
    HP, 
    GROW_SPEED, 
    GROW_LEVEL_UP, 
    MAX_LEVEL, 
    POWER, 
    TYPE, 
    SIZE,
    CONSUMPTION,
    PRODUCTION,
    CAPACITY,
    VISIBILITY,
} = CONFIG.ECONOMY.MYCELIUM;

class Mycelium extends Building {
    constructor({ x, y, guid, callbacks = {} }) {
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

        this.hp = HP;
        this.level = 1; // уровень выросших грибочков
        this.grow = 0;  // накопленный прогресс роста
        this.canGrow = true; // может ли расти грибница (не стоит ли на ней здание)
    }

    get() {
        return {
            ...super.get(),
            level: this.level,
        }
    }

    update() {
        if (!this.canGrow) return false;

        this.grow += GROW_SPEED;
        if (this.grow < GROW_LEVEL_UP) return false;

        this.grow = 0;
        if (this.level < MAX_LEVEL) {
            this.level += 1;
            return true;
        }

        this.canGrow = false;
        return false;
    }

    // сбросить мицелий до 1 уровня (при потреблении реактором)
    consume() {
        this.level = 1;
        this.grow = 0;
        this.canGrow = true;
    }

    getPower() {
        return POWER;
    }

    _getFreeCells(relief, mycelium, buildings, enemyBuildings) {
        if (!relief[0]?.length) return [];

        const rows = relief.length;
        const cols = relief[0].length;
        const { x, y } = this;

        const allBuildings = Object.values(buildings).flat();

        return DIRECTIONS
            .map(({ dx, dy }) => ({ x: x + dx, y: y + dy }))
            .filter(({ x: nx, y: ny }) =>
                nx >= 0 && nx < cols &&
                ny >= 0 && ny < rows &&
                relief[ny][nx] === 0 && // 0 - земля, 1 - вода, 2 - камень, null - нет видимости
                !mycelium.some(mc => mc.x === nx && mc.y === ny) &&
                !allBuildings.some(b => b.x === nx && b.y === ny) &&
                !enemyBuildings.some(b => b.x === nx && b.y === ny)
            );
    }

    canExtend(relief, mycelium, buildings, enemyBuildings) {
        if (this.level < MAX_LEVEL) return [];
        return this._getFreeCells(relief, mycelium, buildings, enemyBuildings);
    }

    extend(freeCells) {
        this.grow = 0;
        this.level = 1;
        this.canGrow = true;
        return freeCells[Math.floor(Math.random() * freeCells.length)];
    }
}

module.exports = Mycelium;