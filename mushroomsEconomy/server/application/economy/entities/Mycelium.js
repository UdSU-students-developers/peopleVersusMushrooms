const CONFIG = require("../../../config");
const Building = require("./Building");

const { 
    TYPE, CONSUMPTION, CAPACITY, SIZE,
    HP, GROW_SPEED, GROW_LEVEL_UP, MAX_LEVEL, PRODUCTION,
} = CONFIG.ECONOMY.MYCELIUM;

class Mycelium extends Building {
    constructor(options) {
        super(options);

        // вынести в Building
        this.type = TYPE;
        this.hp = HP;
        this.size = SIZE;
        this.consumption = CONSUMPTION;
        this.production = PRODUCTION;
        this.capacity = CAPACITY;

        this.level = 0; // уровень выросших грибочков
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
            return;
        }
        this.grow += GROW_SPEED;
        if (this.grow >= GROW_LEVEL_UP) {
            this.grow = 0;
            if (this.level < MAX_LEVEL) {
                this.level += 1;
                return true;
            }
        }
        return false;
    }

    checkAroundMycelium(x, y) {
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

        const map = this.callbacks.getMap();
        const mycelium = this.callbacks.getMycelium();
        const n = map.length;
        const m = map[0]?.length ?? 0;

        return directions
            .map(({ dx, dy }) => ({ x: x + dx, y: y + dy }))
            .filter(({ x: nx, y: ny }) =>
                nx >= 0 && nx < m &&
                ny >= 0 && ny < n &&
                map[ny][nx] === 0 &&
                !mycelium.some(mc => mc.x === nx && mc.y === ny)
            );
    }

    // породить новую грибницу

    canExtend(map, mycelium, buildins, enemyBuildings) {
        // могу вырасти или нет

        const freeCells = this.checkAroundMycelium(this.x, this.y);
        return freeCells.length > 0;
    }

    extend() {
        this.grow = 0;
        this.level = 0;
        const freeCells = this.checkAroundMycelium(this.x, this.y);
        if (freeCells.length === 0) return null;
        const { x, y } = freeCells[Math.floor(Math.random() * freeCells.length)];
        return { x, y };
    }
}

module.exports = Mycelium;