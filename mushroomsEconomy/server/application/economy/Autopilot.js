const CONFIG = require('../../config');

class Autopilot {
    constructor() {
        this.priority = 'economy';
        this.requestsFromArmy = {
            units: [],
            buildings: []
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
        const { POWER } = CONFIG.ECONOMY.MYCELIUM;
        let sum = 0;
        for (const r of economy.buildings.reactors) {
            const consumable = r.getConsumable(economy.buildings.mycelium);
            sum += consumable.length * POWER;
        }
        return sum;
    }

    _updatePriority(economy) {
        const economyReady = this._getEnergyPerTick(economy) >= 5 && this._getIronPerTick(economy) >= 2;
        const hasArmyWork = this.requestsFromArmy.units.length > 0 || this.requestsFromArmy.buildings.length > 0;
        const totalArmyRequests = this.requestsFromArmy.units.length + this.requestsFromArmy.buildings.length;
        const armyByInfrastructure = economy.buildings.reactors.length >= 2 && totalArmyRequests > 2;

        const nextPriority = (hasArmyWork && (economyReady || armyByInfrastructure)) ? 'army' : 'economy';

        if (nextPriority !== this.priority) {
            this.priority = nextPriority;
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

        let reactorUnits = 0;
        for (const r of reactors) {
            reactorUnits += this._getSmallReactorEquivalent(r);
        }

        const mineUnits = mines.length;
        const incubatorUnits = incubators.length;

        const targetRatios = { reactor: 3, mine: 2, incubator: 1 };
        const currentUnits = { reactor: reactorUnits, mine: mineUnits, incubator: incubatorUnits };
        const totalUnits = reactorUnits + mineUnits + incubatorUnits;

        let mostNeeded = null;
        let worstRatio = Infinity;

        for (const [type, target] of Object.entries(targetRatios)) {
            const ratio = currentUnits[type] / (totalUnits * target);
            if (ratio < worstRatio) {
                worstRatio = ratio;
                mostNeeded = type;
            }
        }

        return mostNeeded;
    }

    _mutateLarvae(economy) {
        if (this.priority !== 'army') return;

        const larvaeCopy = [...economy.units.larvae];

        for (const larva of larvaeCopy) {
            if (this.requestsFromArmy.units.length === 0) break;

            const unitType = this.requestsFromArmy.units.shift();
            if (!economy.mutateLarvaToArmyUnit(larva, unitType)) {
                this.requestsFromArmy.units.unshift(unitType);
                break;
            }
        }
    }

    _assignWorkers(economy) {
        const ironCosts = {
            reactor: CONFIG.ECONOMY.BIO_REACTOR_SMALL.IRON_COST,
            incubator: CONFIG.ECONOMY.INCUBATOR.IRON_COST,
            mine: CONFIG.ECONOMY.MINE.IRON_COST
        };

        for (const worker of economy.units.workers) {
            if (worker.assignedBuilding) continue;

            if (this.priority === 'army') {
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