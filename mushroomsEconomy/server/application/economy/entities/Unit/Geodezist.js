const Unit = require('./Unit');
const CONFIG = require('../../../../config');

const { HP, SPEED, TYPE, VISIBILITY } = CONFIG.ECONOMY.GEODEZIST;

class Geodezist extends Unit {
    constructor(options) {
        super({
            ...options,
            type: TYPE,
            visibility: VISIBILITY,
            speed: SPEED,
        });

        this.hp = HP;
        this.wanderRadius = CONFIG.ECONOMY.GEODEZIST.WANDER_RADIUS;

        this.targetResource = null; // { x, y } — координаты целевого ресурса IRON
        this.mode = 'wander'; // 'wander' | 'goToIron'

        this.callbacks = options.callbacks || {};
        // callbacks.getResources() — возвращает 2D-массив ресурсов карты
        // callbacks.getBuildings() — возвращает массив всех зданий
        // callbacks.mutateToMine(geodezist) — вызывается когда геодезист достигает IRON-ресурса
    }

    get() {
        return {
            ...super.get(),
            hp: this.hp,
            mode: this.mode,
            targetResource: this.targetResource,
        };
    }

    update() {
        this._scanForIron();

        if (this.mode === 'goToIron') {
            if (this._hasReachedTarget()) {
                const resource = this._getResourceAt(Math.round(this.x), Math.round(this.y));
                if (resource && resource.type === 'IRON') {
                    this.callbacks.mutateToMine(this);
                    return;
                } else {
                    this.targetResource = null;
                    this.mode = 'wander';
                    this._pickWanderTarget();
                }
            }
        } else {
            // режим блуждания
            if (this._hasReachedTarget()) {
                this._pickWanderTarget();
            }
        }

        super.update();
    }

    _scanForIron() {
        if (!this.callbacks.getResources || !this.callbacks.getBuildings) return;

        const resources = this.callbacks.getResources();
        const buildings = this.callbacks.getBuildings();

        if (!resources) return;

        for (let y = 0; y < resources.length; y++) {
            for (let x = 0; x < resources[y].length; x++) {
                const res = resources[y][x];
                if (!res || res.type !== 'IRON') continue;

                const occupied = buildings.some(b => {
                    const size = b.size ?? 1;
                    return x >= b.x && x < b.x + size && y >= b.y && y < b.y + size;
                });

                if (!occupied) {
                    if (!this.targetResource || this.targetResource.x !== x || this.targetResource.y !== y) {
                        this.targetResource = { x, y };
                        this.mode = 'goToIron';
                        this.setTarget(x, y);
                    }
                    return;
                }
            }
        }

        if (this.mode === 'goToIron') {
            this.targetResource = null;
            this.mode = 'wander';
            this._pickWanderTarget();
        }
    }

    _pickWanderTarget() {
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

            const x = Math.round(this.x + Math.cos(angle) * radius);
            const y = Math.round(this.y + Math.sin(angle) * radius);

            const inBounds = x >= 0 && x < cols && y >= 0 && y < rows;
            const walkable = inBounds && this.grid[y][x] === 0;

            if (walkable) return { x, y };
        }

        return null;
    }

    _getResourceAt(x, y) {
        const resources = this.callbacks.getResources();
        if (resources) {
            return resources[y][x] ?? null;
        }
    }
}

module.exports = Geodezist;