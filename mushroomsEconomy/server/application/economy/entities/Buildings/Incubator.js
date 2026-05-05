const CONFIG = require('../../../../config')
const Building = require('../Buildings/Building');

const {
    TYPE,
    HP,
    SIZE,
    CONSUMPTION,
    PRODUCTION,
    CAPACITY,
    LARVA_ENERGY_COST,
    LARVA_COOLDOWN_MS,
} = CONFIG.ECONOMY.INCUBATOR;

class Incubator extends Building {
    constructor({ type = TYPE, guid, x, y, callbacks = {} }) {
        super({ type, guid, x, y, callbacks, hp: HP, size: SIZE, consumption: CONSUMPTION, production: PRODUCTION, capacity: CAPACITY });

        this.larvaEnergyCost = LARVA_ENERGY_COST;
        this.larvaCooldownMs = LARVA_COOLDOWN_MS;
        this.lastLarvaeCreateAt = 0;
    }

    getSelf() {
        return {
            ...super.getSelf(),
            larvaEnergyCost: this.larvaEnergyCost,
            larvaCooldownMs: this.larvaCooldownMs,
            lastLarvaeCreateAt: this.lastLarvaeCreateAt,
        }
    }

    isCooldownReady(now = Date.now()) {
        return now - this.lastLarvaeCreateAt >= this.larvaCooldownMs;
    }

    getFreeCellsAround() {
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
                (map[ny][nx] === 0 || map[ny][nx] === null)
            );
    }

    createLarvae({ availableEnergy, now = Date.now() }) {
        if (!this.isCooldownReady(now)) return null;
        if (availableEnergy < this.larvaEnergyCost) return null;

        const freeCells = this.getFreeCellsAround();
        if (!freeCells.length) return null;

        const spawnCell = freeCells[Math.floor(Math.random() * freeCells.length)];
        this.callbacks.addLarva?.(spawnCell.x, spawnCell.y, this.x, this.y);
        this.lastLarvaeCreateAt = now;

        return {
            x: spawnCell.x,
            y: spawnCell.y,
            energySpent: this.larvaEnergyCost,
        };
    }
}

module.exports = Incubator;