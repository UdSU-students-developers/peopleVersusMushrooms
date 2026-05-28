const Unit = require('./Unit');
const CONFIG = require('../../../../config');

const { HP, SPEED, TYPE, VISIBILITY, WANDER_RADIUS, SOURCES_VISIBILITY } = CONFIG.ECONOMY.WORKER;

const STEP_OFFSETS = [
    [0, 1], [0, -1], [1, 0], [-1, 0],
];

class Worker extends Unit {
    constructor(options) {
        super({ ...options, type: TYPE, visibility: VISIBILITY, speed: SPEED, sourcesVisibility: SOURCES_VISIBILITY });
        this.hp = HP;
        this.wanderRadius = WANDER_RADIUS;
        this.targetResource = null;
        this.targetIron = null;
        this.assignedBuilding = null;
        this.targetMycelium = null;
        this.mode = 'wander';
        this.callbacks = options.callbacks || {};
    }

    get() {
        return {
            ...super.get(),
            hp: this.hp,
            mode: this.mode,
            targetResource: this.targetResource,
            assignedBuilding: this.assignedBuilding,
        };
    }

    update() {
        if (this.assignedBuilding === 'mine') {
            this._handleMineAssignment();
        } else if (this.assignedBuilding) {
            this._handleAssignedBuilding();
        } else {
            this._handleIronSearch();
        }

        this._recoverFromBlockedPath();
        super.update();
    }

    _recoverFromBlockedPath() {
        if (this._hasReachedTarget()) {
            this._blockedPathTicks = 0;
            return;
        }

        if (this.path.length > 0) {
            this._blockedPathTicks = 0;
            return;
        }

        this._blockedPathTicks = (this._blockedPathTicks || 0) + 1;
        if (this._blockedPathTicks < 3) return;

        this._blockedPathTicks = 0;
        this.targetResource = null;
        this.targetIron = null;
        this.mode = 'wander';
        this.targetX = Math.round(this.x); 
        this.targetY = Math.round(this.y);
        this._recalculatePath();
    }

    _handleMineAssignment() {
        if (!this.targetIron) {
            const iron = this._findReachableIron();
            if (!iron) {
                if (this.mode === 'wander' && this._hasReachedTarget()) {
                    this._pickWanderTarget();
                }
                return;
            }

            this.targetIron = { x: iron.x, y: iron.y };
            this.targetResource = iron;
            this.mode = 'goToIron';
            this.setTarget(iron.standX, iron.standY);
            return;
        }

        if (this.mode === 'goToIron' && this._hasReachedTarget()) {
            if (this.callbacks.mutateToMine) {
                this.callbacks.mutateToMine(this);
            }
        }
    }

    _handleAssignedBuilding() {
        if (!this.targetMycelium) {
            const mycelium = this._findFreeMycelium();
            if (!mycelium) return;
            this.targetMycelium = mycelium;
            this.mode = 'goToMycelium';
            this.setTarget(mycelium.x, mycelium.y);
            return;
        }

        if (this._hasReachedTarget()) {
            this._mutateToAssignedBuilding();
        }
    }

    _findFreeMycelium() {
        const mycelium = this.callbacks.getMycelium ? this.callbacks.getMycelium() : [];
        const buildings = this.callbacks.getBuildings ? this.callbacks.getBuildings() : [];
        const workers = this.units.filter(u => u.guid !== this.guid && u.targetMycelium);

        const takenCells = new Set();
        for (const w of workers) {
            takenCells.add(`${w.targetMycelium.x},${w.targetMycelium.y}`);
        }
        for (const b of buildings) {
            if (b.type === 'mycelium') continue;
            const size = b.size || 1;
            for (let dy = 0; dy < size; dy++) {
                for (let dx = 0; dx < size; dx++) {
                    takenCells.add(`${b.x + dx},${b.y + dy}`);
                }
            }
        }

        let free = mycelium.filter(m => !takenCells.has(`${m.x},${m.y}`));
        if (!free.length) return null;

        const cx = Math.round(this.x);
        const cy = Math.round(this.y);
        const awayFromSelf = free.filter(m => m.x !== cx || m.y !== cy);
        if (awayFromSelf.length) free = awayFromSelf;

        free.sort((a, b) => (this.x - a.x) ** 2 + (this.y - a.y) ** 2 - (this.x - b.x) ** 2 - (this.y - b.y) ** 2);
        return free[0];
    }

    _mutateToAssignedBuilding() {
        const type = this.assignedBuilding;
        this.assignedBuilding = null;
        this.targetMycelium = null;
        this.mode = 'wander';

        if (type === 'reactor' || type === 'small_reactor') {
            if (this.callbacks.mutateToSmallReactor) {
                this.callbacks.mutateToSmallReactor(this);
            }
        } else if (type === 'incubator') {
            if (this.callbacks.mutateToIncubator) {
                this.callbacks.mutateToIncubator(this);
            }
        }
    }

    _handleIronSearch() {
        this._scanForIron();

        if (this.mode === 'goToIron' && this._hasReachedTarget()) {
            this._resetToWander();
        } else if (this.mode === 'wander' && this._hasReachedTarget()) {
            this._pickWanderTarget();
        }
    }

    _findReachableIron() {
        const resources = this.callbacks.getResources ? this.callbacks.getResources() : null;
        const buildings = this.callbacks.getBuildings ? this.callbacks.getBuildings() : null;
        if (!resources || !buildings || !this.grid) return null;

        const takenTargets = new Set();
        for (const unit of this.units) {
            if (unit.guid === this.guid) continue;
            if (unit.targetIron) {
                takenTargets.add(`${unit.targetIron.x},${unit.targetIron.y}`);
            } else if (unit.targetResource) {
                takenTargets.add(`${unit.targetResource.x},${unit.targetResource.y}`);
            }
        }

        const candidates = [];

        resources.forEach((row, y) => {
            if (!row) return;
            row.forEach((res, x) => {
                if (!res || res.type !== 'IRON') return;

                const occupied = buildings.some(b => {
                    if (b.type === 'mycelium') return false;
                    const size = b.size || 1;
                    return x >= b.x && x < b.x + size && y >= b.y && y < b.y + size;
                });
                if (occupied) return;

                const approach = this._getIronApproachCell(x, y);
                if (!approach) return;

                candidates.push({
                    x,
                    y,
                    standX: approach.x,
                    standY: approach.y,
                    distSq: (this.x - approach.x) ** 2 + (this.y - approach.y) ** 2,
                });
            });
        });

        candidates.sort((a, b) => a.distSq - b.distSq);
        return candidates.find(cell => !takenTargets.has(`${cell.x},${cell.y}`)) || null;
    }

    _getIronApproachCell(ironX, ironY) {
        if (!this.grid) return null;
        if (this.grid[ironY]?.[ironX] === 0) {
            return { x: ironX, y: ironY };
        }

        for (const [dx, dy] of STEP_OFFSETS) {
            const standX = ironX + dx;
            const standY = ironY + dy;
            if (this.grid[standY]?.[standX] === 0) {
                return { x: standX, y: standY };
            }
        }

        return null;
    }

    _scanForIron() {
        if (this.mode === 'goToIron' && this.targetResource) return;

        const iron = this._findReachableIron();
        if (!iron) return;

        this.targetIron = { x: iron.x, y: iron.y };
        this.targetResource = iron;
        this.mode = 'goToIron';
        this.setTarget(iron.standX, iron.standY);
    }

    _resetToWander() {
        this.targetResource = null;
        this.targetIron = null;
        this.mode = 'wander';
        this._pickWanderTarget();
    }

    _pickWanderTarget() {
        if (!this.grid) return;
        const rows = this.grid.length;
        const cols = this.grid[0] ? this.grid[0].length : 0;

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
        const resources = this.callbacks.getResources ? this.callbacks.getResources() : null;
        if (!resources || !resources[y]) return null;
        return resources[y][x] || null;
    }
}

module.exports = Worker;
