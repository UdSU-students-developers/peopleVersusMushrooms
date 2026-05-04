class Mycelium {
    constructor({ x, y, guid, callbacks = {}, options }) {


        this.options = options.options;

        this.hp = this.options.hp;
        this.grow_speed = this.options.grow_speed;
        this.grow_level_up = this.options.grow_level_up;
        this.max_level = this.options.max_level;
        this.power = this.options.power;


        this.x = x;
        this.y = y;
        this.guid = guid;
        this.callbacks = callbacks;

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
        this.grow += this.grow_speed;
        if (this.grow >= this.grow_level_up) {
            this.grow = 0;
            if (this.level < this.max_level) {
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
        return this.power;
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
        if (this.level >= this.max_level) {
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