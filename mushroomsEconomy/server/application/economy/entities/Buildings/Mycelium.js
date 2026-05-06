const CONFIG = require("../../../../config");
const Building = require("./Building");

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
        this.grow = 0; // скорость роста
        this.canGrow = true; // может ли расти грибница (не стоит ли на ней здание)
    }

    get() {
        return {
            ...super.get(),
            level: this.level,
        }
    }

    update() {
        if (!this.canGrow) {
            return false;
        }
        this.grow += GROW_SPEED;
        if (this.grow >= GROW_LEVEL_UP) {
            this.grow = 0;
            if (this.level < MAX_LEVEL) {
                this.level += 1;
                return true;
            } else {
                this.canGrow = false;
            }
        }
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

    checkAroundMycelium(map, mycelium, buildings, enemyBuildings) {
        const n = map.length;
        if (!n) return [];
        const m = map[0].length;
        if (!m) return [];

        const x = this.x;
        const y = this.y;
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: -1, dy: -1 },
            { dx: 1, dy: -1 },
            { dx: -1, dy: 1 },
            { dx: 1, dy: 1 },
        ];

        const allBuildings = Object.values(buildings).flat();

        return directions
            .map(({ dx, dy }) => ({ x: x + dx, y: y + dy }))
            .filter(({ x: nx, y: ny }) =>
                nx >= 0 && nx < m &&
                ny >= 0 && ny < n &&
                [0, 1, 2].includes(map[ny][nx]) && // 0 - земля, 1 - вода, 2 - камень
                !mycelium.some(mc => mc.x === nx && mc.y === ny) &&
                !allBuildings.some(b => b.x === nx && b.y === ny) &&
                !enemyBuildings.some(b => b.x === nx && b.y === ny)
            );
    }

    // породить новую грибницу
    canExtend(map, mycelium, buildings, enemyBuildings) {
        if (this.level >= MAX_LEVEL) {
            // могу вырасти или нет
            const freeCells = this.checkAroundMycelium(map, mycelium, buildings, enemyBuildings);
            return freeCells.length > 0;
        }
        return false;
    }

    extend(map, mycelium, buildings, enemyBuildings) {
        this.grow = 0;
        this.level = 1;
        this.canGrow = true;
        const freeCells = this.checkAroundMycelium(map, mycelium, buildings, enemyBuildings);
        if (!freeCells.length) {
            return null;
        }
        const { x, y } = freeCells[Math.floor(Math.random() * freeCells.length)];
        return { x, y };
    }
}

module.exports = Mycelium;