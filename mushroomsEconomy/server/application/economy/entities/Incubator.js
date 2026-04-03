const CONFIG = require('../../../config')
const Larva = require('../entities/Larva');
const Building = require('../entities/Building');

const { HP, SIZE, CONSUMPTION, PRODUCTION, CAPACITY } = CONFIG.ECONOMY.INCUBATOR;

// Раз в какое то время должен порождать личинку
// 60 железа для личинки

class Incubator extends Building {
    constructor(options) {
        super(options);

        this.hp = HP;
        this.size = SIZE;
        this.consumption = CONSUMPTION; // энергопотребление за единицу времени
        this.production = PRODUCTION; // сколько производит за единицу времени
        this.capacity = CAPACITY; // емкость внутреннего хранилища

        this.currentIron = 0;
    }

    getSelf() {
        return {
            ...super.getSelf(),
            currentIron: this.currentIron
        }
    }

    addIron(amount) {
        if (this.currentIron < CAPACITY) {
            this.currentIron += amount;
        }
    }

    canCreateLarva() {
        if (this.currentIron < 60) return false;
        const freeCells = this.checkAround();
        return freeCells.length > 0;
    }

    checkAround() {
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

    createLarva() {
        if (this.currentIron >= 60) {
            this.currentIron -= 60;
            const freeCells = this.checkAround();
            const spawnPoint = freeCells[0];
            
            return new Larva();
        }

        return null;
    }
}

module.exports = Incubator;