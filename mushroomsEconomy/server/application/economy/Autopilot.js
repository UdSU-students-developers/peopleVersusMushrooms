const CONFIG = require('../../config');

class Autopilot {

    constructor() {
        this.prioritet = "economy"; //Тут ставиться приоритет на чьи нужды будет в первую очередь направлять ресурсы экономика: свои (economy) или армии (army)
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

    _updatePriority() {
        const totalRequests = this.requestsFromArmy.units.length + this.requestsFromArmy.buildings.length;
        this.prioritet = totalRequests > 3 ? "army" : "economy";
    }

    _getIronProductionPerTick(economy) {
        return economy.buildings.mines.length * CONFIG.ECONOMY.MINE.PRODUCTION;
    }

    _getEnergyProductionPerTick(economy) {
        return economy.buildings.reactors.reduce((sum, r) => {
            const prod = r.type === CONFIG.ECONOMY.BIO_REACTOR_SMALL.TYPE
                ? CONFIG.ECONOMY.BIO_REACTOR_SMALL.PRODUCTION
                : CONFIG.ECONOMY.BIO_REACTOR.PRODUCTION;
            return sum + prod;
        }, 0);
    }

    _getLarvaeProductionPerTick(economy) {
        return economy.buildings.incubators.length * CONFIG.ECONOMY.INCUBATOR.PRODUCTION;
    }

    _getNeededBuildingType(economy) {
        const { mines, reactors, incubators } = economy.buildings;

        if (mines.length === 0) return 'mine';
        if (reactors.length === 0) return 'reactor';

        const scores = {
            mine:      this._getIronProductionPerTick(economy)   / CONFIG.ECONOMY.MINE.IRON_COST,
            reactor:   this._getEnergyProductionPerTick(economy) / CONFIG.ECONOMY.BIO_REACTOR_SMALL.IRON_COST,
            incubator: this._getLarvaeProductionPerTick(economy) / CONFIG.ECONOMY.INCUBATOR.IRON_COST,
        };

        return Object.entries(scores).reduce(
            (min, [type, score]) => score < min.score ? { type, score } : min,
            { type: null, score: Infinity }
        ).type;
    }

    _mutateLarvae(economy) {
        const { MUTATION_IRON_COST, MUTATION_ENERGY_COST } = CONFIG.ECONOMY.LARVA;

        if (this.prioritet === "army") {
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
        } else {
        }
    }

    _mutateWorkers(economy) {
        const ironCosts = {
            reactor:   CONFIG.ECONOMY.BIO_REACTOR_SMALL.IRON_COST,
            mine:      CONFIG.ECONOMY.MINE.IRON_COST,
            incubator: CONFIG.ECONOMY.INCUBATOR.IRON_COST,
        };

        if (this.prioritet === "army") {
            for (const worker of [...economy.units.workers]) {
                if (this.requestsFromArmy.buildings.length === 0) break;

                const buildingType = this.requestsFromArmy.buildings[0];
                const cost = ironCosts[buildingType] ?? 0;
                if (economy.resources.iron < cost) break;

                this.requestsFromArmy.buildings.shift();
                economy.resources.iron -= cost;

                switch (buildingType) {
                    case 'reactor':
                        economy.mutateWorkerToReactor(worker);
                        break;
                    case 'small_reactor':
                        economy.mutateWorkerToSmallReactor(worker);
                        break;
                    default:
                        break;
                }
            }
        } else {
            for (const worker of [...economy.units.workers]) {
                const neededType = this._getNeededBuildingType(economy);
                const cost = ironCosts[neededType] ?? 0;
                if (economy.resources.iron < cost) break;

                economy.resources.iron -= cost;

                switch (neededType) {
                    case 'reactor':
                        economy.mutateWorkerToSmallReactor(worker);
                        break;
                    case 'incubator':
                        economy.mutateWorkerToIncubator(worker);
                        break;
                    default:
                        economy.resources.iron += cost; // не потратили — вернуть
                        break;
                }
            }
        }
    }

    update(economy) {
        this._updatePriority();
        this._mutateLarvae(economy);
        this._mutateWorkers(economy);
    }
}

module.exports = Autopilot;