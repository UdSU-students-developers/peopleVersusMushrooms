const Larva = require('../Unit/Larva');
const Building = require('../Buildings/Building');

class Incubator extends Building {
    constructor({ type, guid, x, y, callbacks = {}, options }) {
        this.options = options.options;

        this.hp = this.options.hp;
        this.size = this.options.size;
        this.consumption = this.options.consumption;
        this.production = this.options.production;
        this.capacity = this.options.capacity;

        this.currentIron = 0;
        this.larvaProgress = 0;
        this.isCreating = false;

        super({ type, guid, x, y, callbacks, hp: this.hp, size: this.size, consumption: this.consumption, production: this.production, capacity: this.capacity });
    }

    getSelf() {
        return {
            ...super.getSelf(),
            currentIron: this.currentIron,
            larvaProgress: this.larvaProgress,
            isCreating: this.isCreating
        }
    }

    addIron(amount) {
        if (this.currentIron < CAPACITY) {
            this.currentIron += amount;
        }
    }

    canCreateLarva() {
        if (this.currentIron < 60 || this.isCreating) return false;
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
        const n = map.length;
        const m = map[0]?.length ?? 0;

        return directions
            .map(({ dx, dy }) => ({ x: this.x + dx, y: this.y + dy }))
            .filter(({ x: nx, y: ny }) =>
                nx >= 0 && nx < m &&
                ny >= 0 && ny < n &&
                map[ny][nx] === 0
            );
    }

    startCreating() {
        if (!this.canCreateLarva()) return false;

        this.currentIron -= 60;
        this.larvaProgress = 0;
        this.isCreating = true;

        return true;
    }

    createLarva() {
        if (!this.isCreating || this.larvaProgress < 100) return null;

        const freeCells = this.checkAround();

        if (freeCells.length === 0) {
            console.log("Incubator: нет свободных клеток для создания личинки");
            this.isCreating = false;
            this.larvaProgress = 0;
            return null;
        }

        const spawnPoint = freeCells[0];

        console.log(`Incubator: личинка создана на координатах x: ${this.x} y: ${this.y}`);

        this.isCreating = false;
        this.larvaProgress = 0;

        return new Larva({
            x: spawnPoint.x,
            y: spawnPoint.y,
            homeX: this.x,
            homeY: this.y
        });
    }

    updateLarvaProgress(availableEnergy) {
        if (availableEnergy && availableEnergy >= this.consumption) {
            this.larvaProgress += this.production;
            return true;
        }
        return false;
    }
}

module.exports = Incubator;