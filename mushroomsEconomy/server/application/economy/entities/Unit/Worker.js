const Unit = require('./Unit');
const CONFIG = require('../../../../config');

const { HP, SPEED, TYPE, VISIBILITY, WANDER_RADIUS, SOURCES_VISIBILITY } = CONFIG.ECONOMY.WORKER;

class Worker extends Unit {
    constructor(options) {
        super({ ...options, type: TYPE, visibility: VISIBILITY, speed: SPEED, sourcesVisibility: SOURCES_VISIBILITY});
        this.hp = HP;
        this.wanderRadius = WANDER_RADIUS;
        this.targetResource = null;
        this.mode = 'wander'; // 'wander' | 'goToIron'
        this.callbacks = options.callbacks || {};
    }

    get() {
        return { ...super.get(), hp: this.hp, mode: this.mode, targetResource: this.targetResource };
    }

    update() {
        this._scanForIron();

        if (this.mode === 'goToIron' && this._hasReachedTarget()) {
            const res = this._getResourceAt(Math.round(this.x), Math.round(this.y));
            if (res?.type === 'IRON') {
                this.callbacks.mutateToMine?.(this);
                return;
            }
            this._resetToWander();
        } else if (this.mode === 'wander' && this._hasReachedTarget()) {
            this._pickWanderTarget();
        }

        super.update();
    }

    _scanForIron() {
        if (this.mode === 'goToIron' && this.targetResource) return;

        const resources = this.callbacks.getResources?.();
        const buildings = this.callbacks.getBuildings?.();
        if (!resources || !buildings) return;

        const takenTargets = new Set();
        for (const unit of this.units) {
            if (unit.guid !== this.guid && unit.targetResource) {
                takenTargets.add(`${unit.targetResource.x},${unit.targetResource.y}`);
            }
        }

        const ironCells = [];

        resources.forEach((row, y) => {
            if (!row) return;
            row.forEach((res, x) => {
                if (res?.type !== 'IRON') return;

                const occupied = buildings.some(b => {
                    if (b.type === 'mycelium') return false;
                    const size = b.size ?? 1;
                    return x >= b.x && x < b.x + size && y >= b.y && y < b.y + size;
                });

                if (!occupied) {
                    ironCells.push({ x, y, distSq: (this.x - x) ** 2 + (this.y - y) ** 2 });
                }
            });
        });

        ironCells.sort((a, b) => a.distSq - b.distSq);

        const closestIron = ironCells.find(cell => !takenTargets.has(`${cell.x},${cell.y}`)) ?? null;

        if (closestIron) {
            this.targetResource = closestIron;
            this.mode = 'goToIron';
            this.setTarget(closestIron.x, closestIron.y);
        }
    }

    _resetToWander() {
        this.targetResource = null;
        this.mode = 'wander';
        this._pickWanderTarget();
    }

    _pickWanderTarget() {
        if (!this.grid) return;
        const rows = this.grid.length;
        const cols = this.grid[0]?.length ?? 0;

        for (let attempt = 0; attempt < 10; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.sqrt(Math.random()) * this.wanderRadius;

            const x = Math.round(this.x + Math.cos(angle) * radius);
            const y = Math.round(this.y + Math.sin(angle) * radius);

            if (x >= 0 && x < cols && y >= 0 && y < rows && this.grid[y][x] === 0) {
                this.setTarget(x, y);
                return;
            }
        }
    }

    _getResourceAt(x, y) {
        return this.callbacks.getResources?.()[y]?.[x] ?? null;
    }
}

module.exports = Worker;