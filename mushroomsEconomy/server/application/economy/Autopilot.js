const CONFIG = require('../../config');

class Autopilot {

    constructor() {
        this.priority = "economy";
        this.requestsFromArmy = {
            units: [],
            buildings: [],
        };
    }

    addUnitRequests(unitType, amount) {
        for (let i = 0; i < amount; i++) {
            this.requestsFromArmy.units.push(unitType);
        }
    }

    addBuildingRequests(buildingType, amount) {
        for (let i = 0; i < amount; i++) {
            this.requestsFromArmy.buildings.push(buildingType);
        }
    }

    _getIronPerTick(economy) {
        return economy.buildings.mines.length * CONFIG.ECONOMY.MINE.PRODUCTION;
    }

    _getEnergyPerTick(economy) {
        return economy.buildings.reactors.reduce((sum, r) => {
            const prod = r.type === CONFIG.ECONOMY.BIO_REACTOR_SMALL.TYPE
                ? CONFIG.ECONOMY.BIO_REACTOR_SMALL.PRODUCTION
                : CONFIG.ECONOMY.BIO_REACTOR.PRODUCTION;
            return sum + prod;
        }, 0);
    }

    _updatePriority(economy) {
        const economyReady = this._getEnergyPerTick(economy) >= 5 && this._getIronPerTick(economy) >= 2;
        const hasArmyWork = this.requestsFromArmy.units.length > 0
            || this.requestsFromArmy.buildings.length > 0;
        const next = (economyReady && hasArmyWork) ? "army" : "economy";

        if (next !== this.priority) {
            this.priority = next;
            economy.updated = true;
        }
    }

    _getSmallReactorEquivalent(reactor) {
        return reactor.type === CONFIG.ECONOMY.BIO_REACTOR_SMALL.TYPE ? 1 : 2;
    }

    _getNeededBuildingType(economy) {
        const { mines, reactors, incubators } = economy.buildings;

        if (mines.length === 0) return 'mine';
        if (reactors.length === 0) return 'reactor';

        const reactorUnits = reactors.reduce((sum, r) => sum + this._getSmallReactorEquivalent(r), 0);
        const mineUnits = mines.length;
        const incubatorUnits = incubators.length;

        const targetRatios = { reactor: 3, mine: 2, incubator: 1 };
        const current = { reactor: reactorUnits, mine: mineUnits, incubator: incubatorUnits };

        const total = reactorUnits + mineUnits + incubatorUnits;

        let mostNeeded = null;
        let worstRatio = Infinity;

        for (const [type, target] of Object.entries(targetRatios)) {
            const ratio = current[type] / (total * target);
            if (ratio < worstRatio) {
                worstRatio = ratio;
                mostNeeded = type;
            }
        }

        return mostNeeded;
    }

    _mutateLarvae(economy) {
        const { MUTATION_IRON_COST, MUTATION_ENERGY_COST } = CONFIG.ECONOMY.LARVA;

        if (this.priority !== "army") return;

        for (const larva of [...economy.units.larvae]) {
            if (this.requestsFromArmy.units.length === 0) break;
            if (economy.resources.iron < MUTATION_IRON_COST) break;
            if (economy.resources.energy < MUTATION_ENERGY_COST) break;

            const unitType = this.requestsFromArmy.units.shift();
            economy.resources.iron -= MUTATION_IRON_COST;
            economy.resources.energy -= MUTATION_ENERGY_COST;
            economy.units.larvae = economy.units.larvae.filter(l => l.guid !== larva.guid);
            economy.spawnArmyUnit({
                armyGuid: economy.guids.mushroomsArmy,
                type: unitType,
                x: larva.x,
                y: larva.y,
            });
        }
    }

    _assignWorkers(economy) {
        const ironCosts = {
            reactor:   CONFIG.ECONOMY.BIO_REACTOR_SMALL.IRON_COST,
            incubator: CONFIG.ECONOMY.INCUBATOR.IRON_COST,
            mine:      CONFIG.ECONOMY.MINE.IRON_COST,
        };

        for (const worker of economy.units.workers) {
            if (worker.assignedBuilding) continue;

            if (this.priority === "army") {
                if (this.requestsFromArmy.buildings.length === 0) continue;

                const buildingType = this.requestsFromArmy.buildings[0];
                const cost = ironCosts[buildingType] || 0;
                if (economy.resources.iron < cost) continue;

                this.requestsFromArmy.buildings.shift();
                worker.assignedBuilding = buildingType;

            } else {
                const neededType = this._getNeededBuildingType(economy);
                const cost = ironCosts[neededType] || 0;
                if (economy.resources.iron < cost) continue;

                worker.assignedBuilding = neededType;
                break;
            }
        }
    }

    update(economy) {
        this._updatePriority(economy);
        this._mutateLarvae(economy);
        this._assignWorkers(economy);
    }
}

module.exports = Autopilot;