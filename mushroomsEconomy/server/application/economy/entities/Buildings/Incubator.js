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
    VISIBILITY,
} = CONFIG.ECONOMY.INCUBATOR;

class Incubator extends Building {
    constructor({ guid, x, y, callbacks = {} }) {
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