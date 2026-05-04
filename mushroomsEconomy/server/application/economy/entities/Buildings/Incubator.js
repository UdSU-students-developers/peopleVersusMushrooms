const CONFIG = require('../../../../config')
const Larva = require('../Unit/Larva');
const Building = require('../Buildings/Building');

const { HP, SIZE, CONSUMPTION, PRODUCTION, CAPACITY } = CONFIG.ECONOMY.INCUBATOR;

class Incubator extends Building {
    constructor({ type, guid, x, y, callbacks = {} }) {
        super({ type, guid, x, y, callbacks, hp: HP, size: SIZE, consumption: CONSUMPTION, production: PRODUCTION, capacity: CAPACITY });

        this.currentIron = 0;
        this.larvaProgress = 0;
        this.isCreating = false;
    }

    getSelf() {
        return {
            ...super.getSelf(),
            currentIron: this.currentIron,
            larvaProgress: this.larvaProgress,
            isCreating: this.isCreating
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

}

module.exports = Incubator;