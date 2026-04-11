const CONFIG = require("../../../../config");

const { HP, GROW_SPEED, GROW_LEVEL_UP, MAX_LEVEL, POWER } = CONFIG.ECONOMY.MYCELIUM;

class Mycelium {
    constructor({ x, y, guid, callbacks = {} }) {
        this.x = x;
        this.y = y;
        this.guid = guid;
        this.callbacks = callbacks;

        this.hp = HP;
        this.level = 1; // уровень выросших грибочков
        this.grow = 0; // скорость роста
        this.canGrow = true; // может ли расти грибница (не стоит ли на ней здание)
    }

    get() {
        return {
            guid: this.guid,
            level: this.level,
            coords: { x: this.x, y: this.y },
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

    checkAroundMycelium(map, mycelium) {
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

        return directions
            .map(({ dx, dy }) => ({ x: x + dx, y: y + dy }))
            .filter(({ x: nx, y: ny }) =>
                nx >= 0 && nx < m &&
                ny >= 0 && ny < n &&
                map[ny][nx] === (0 || 1 || 2) && // 0 - земля, 1 - вода, 2 - камень
                !mycelium.some(mc => mc.x === nx && mc.y === ny)
            );
    }

    // породить новую грибницу
    canExtend(map, mycelium, buildins, enemyBuildings) {
        if (this.level >= MAX_LEVEL) {
            // могу вырасти или нет
            const freeCells = this.checkAroundMycelium(map, mycelium);
            return freeCells.length > 0;
        }
        return false;
    }

    extend(map, mycelium, buildins, enemyBuildings) {
        this.grow = 0;
        this.level = 1;
        this.canGrow = true;
        const freeCells = this.checkAroundMycelium(map, mycelium);
        if (!freeCells.length) {
            return null;
        }
        const { x, y } = freeCells[Math.floor(Math.random() * freeCells.length)];
        return { x, y };
    }
}

module.exports = Mycelium;