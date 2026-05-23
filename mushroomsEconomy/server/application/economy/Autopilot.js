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
        if (totalRequests > 10) {
            this.prioritet = "army";
        } else {
            this.prioritet = "economy";
        }
    }

    _getNeededBuildingType(economy) {
        const reactorCount = economy.buildings.reactors.length;
        const mineCount = economy.buildings.mines.length;
        const incubatorCount = economy.buildings.incubators.length;

        const energy = economy.resources.energy;
        const iron = economy.resources.iron;
        const larvaeCount = economy.units.larvae.length;

        // чем меньше значение — тем больше нехватка
        const scores = {
            reactor: energy,
            mine: iron,
            incubator: larvaeCount,
        };

        let neededType = null;
        let minScore = Infinity;

        for (const [type, score] of Object.entries(scores)) {
            if (score < minScore) {
                minScore = score;
                neededType = type;
            }
        }

        return neededType;
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
            reactor: CONFIG.ECONOMY.BIO_REACTOR.IRON_COST,
            small_reactor: CONFIG.ECONOMY.BIO_REACTOR_SMALL.IRON_COST,
            mine: CONFIG.ECONOMY.MINE.IRON_COST,
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
                        economy.mutateWorkerToReactor(worker);
                        break;
                    case 'incubator':
                        economy.mutateWorkerToSmallReactor(worker);
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