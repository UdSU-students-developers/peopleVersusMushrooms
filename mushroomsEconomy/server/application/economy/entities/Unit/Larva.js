const Unit = require('./Unit');
const CONFIG = require('../../../../config');

const { HP, SPEED, WANDER_RADIUS, TYPE, VISIBILITY, SOURCES_VISIBILITY, GROWTH_LIMIT } = CONFIG.ECONOMY.LARVA;

class Larva extends Unit {
    constructor(options) {
        super({
            ...options,
            type: TYPE,
            visibility: VISIBILITY,
            speed: SPEED,
            sourcesVisibility: SOURCES_VISIBILITY,
        });

        this.homeX = options.homeX ?? options.x;
        this.homeY = options.homeY ?? options.y;

        this.hp = HP;
        this.growthScale = 0;
        this.wanderRadius = WANDER_RADIUS;
        this.callbacks = options.callbacks || {};
    }

    get() {
        return {
            ...super.get(),
            hp: this.hp,
            growthScale: this.growthScale,
        };
    }

    update() {
        this.growthScale += 1;

        if (this.growthScale >= GROWTH_LIMIT) {
            this.callbacks.mutateToWorker(this);
            return;
        }

        if (this._hasReachedTarget()) {
            this._wanderAroundHome();
        }

        super.update();
    }


    _wanderAroundHome() {
        const target = this._pickRandomWalkableCell();
        if (target) {
            this.setTarget(target.x, target.y);
        }
    }

    _pickRandomWalkableCell() {
        if (!this.grid) return null;

        const rows = this.grid.length;
        const cols = this.grid[0]?.length ?? 0;

        for (let attempt = 0; attempt < 10; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.sqrt(Math.random()) * this.wanderRadius;

            const x = Math.round(this.homeX + Math.cos(angle) * radius);
            const y = Math.round(this.homeY + Math.sin(angle) * radius);

            const inBounds = x >= 0 && x < cols && y >= 0 && y < rows;
            const walkable = inBounds && this.grid[y][x] === 0;

            if (walkable) return { x, y };
        }

        return null;
    }
}

module.exports = Larva;