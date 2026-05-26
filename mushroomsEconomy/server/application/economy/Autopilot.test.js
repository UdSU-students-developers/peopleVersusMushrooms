const Autopilot = require('./Autopilot');

jest.mock('../../config', () => ({
    ECONOMY: {
        MINE: {
            PRODUCTION: 2,
            IRON_COST: 20,
        },
        BIO_REACTOR_SMALL: {
            TYPE: 'small_reactor',
            PRODUCTION: 3,
            IRON_COST: 30,
        },
        BIO_REACTOR: {
            TYPE: 'reactor',
            PRODUCTION: 5,
            IRON_COST: 60,
        },
        INCUBATOR: {
            PRODUCTION: 1,
            IRON_COST: 40,
        },
        LARVA: {
            MUTATION_IRON_COST: 10,
            MUTATION_ENERGY_COST: 15,
        },
    },
}));

describe('Autopilot Tests', () => {
    let autopilot;
    let mockEconomy;

    beforeEach(() => {
        autopilot = new Autopilot();
        
        mockEconomy = {
            resources: { iron: 100, energy: 100 },
            units: { larvae: [], workers: [] },
            buildings: { mines: [], reactors: [], incubators: [] },
            guids: { mushroomsArmy: 'army-guid-123' },
            spawnArmyUnit: jest.fn(),
            mutateWorkerToReactor: jest.fn(),
            mutateWorkerToSmallReactor: jest.fn(),
            mutateWorkerToIncubator: jest.fn(),
        };
    });

    describe('addUnitRequests', () => {
        test('должен добавлять запросы юнитов в очередь', () => {
            autopilot.addUnitRequests('sporomet', 3);
            autopilot.addUnitRequests('champigneb', 2);

            expect(autopilot.requestsFromArmy.units).toHaveLength(5);
            expect(autopilot.requestsFromArmy.units[0]).toBe('sporomet');
            expect(autopilot.requestsFromArmy.units[3]).toBe('champigneb');
        });
    });

    describe('addBuildingRequests', () => {
        test('должен добавлять запросы зданий в очередь', () => {
            autopilot.addBuildingRequests('reactor', 2);
            autopilot.addBuildingRequests('small_reactor', 1);

            expect(autopilot.requestsFromArmy.buildings).toHaveLength(3);
            expect(autopilot.requestsFromArmy.buildings[0]).toBe('reactor');
            expect(autopilot.requestsFromArmy.buildings[2]).toBe('small_reactor');
        });
    });

    describe('_updatePriority', () => {
        test('должен установить приоритет army когда запросов > 3', () => {
            autopilot.addUnitRequests('sporomet', 2);
            autopilot.addBuildingRequests('reactor', 2);
            
            autopilot._updatePriority();
            expect(autopilot.prioritet).toBe('army');
        });

        test('должен установить приоритет economy когда запросов <= 3', () => {
            autopilot.addUnitRequests('sporomet', 1);
            autopilot.addBuildingRequests('reactor', 1);
            
            autopilot._updatePriority();
            expect(autopilot.prioritet).toBe('economy');
        });

        test('должен установить приоритет economy когда запросов нет', () => {
            autopilot._updatePriority();
            expect(autopilot.prioritet).toBe('economy');
        });
    });

    describe('_getIronProductionPerTick', () => {
        test('должен рассчитывать производство железа', () => {
            mockEconomy.buildings.mines = [{}, {}, {}];
            const production = autopilot._getIronProductionPerTick(mockEconomy);
            expect(production).toBe(6);
        });

        test('должен вернуть 0 когда нет шахт', () => {
            mockEconomy.buildings.mines = [];
            const production = autopilot._getIronProductionPerTick(mockEconomy);
            expect(production).toBe(0);
        });
    });

    describe('_getEnergyProductionPerTick', () => {
        test('должен рассчитывать производство энергии', () => {
            mockEconomy.buildings.reactors = [
                { type: 'reactor' },
                { type: 'small_reactor' },
                { type: 'reactor' },
            ];
            const production = autopilot._getEnergyProductionPerTick(mockEconomy);
            expect(production).toBe(13);
        });

        test('должен вернуть 0 когда нет реакторов', () => {
            mockEconomy.buildings.reactors = [];
            const production = autopilot._getEnergyProductionPerTick(mockEconomy);
            expect(production).toBe(0);
        });
    });

    describe('_getLarvaeProductionPerTick', () => {
        test('должен рассчитывать производство личинок', () => {
            mockEconomy.buildings.incubators = [{}, {}, {}];
            const production = autopilot._getLarvaeProductionPerTick(mockEconomy);
            expect(production).toBe(3);
        });
    });

    describe('_getNeededBuildingType', () => {
        test('должен вернуть mine когда нет шахт', () => {
            mockEconomy.buildings.mines = [];
            mockEconomy.buildings.reactors = [{}];
            mockEconomy.buildings.incubators = [{}];
            const result = autopilot._getNeededBuildingType(mockEconomy);
            expect(result).toBe('mine');
        });

        test('должен вернуть reactor когда нет реакторов', () => {
            mockEconomy.buildings.mines = [{}];
            mockEconomy.buildings.reactors = [];
            mockEconomy.buildings.incubators = [{}];
            const result = autopilot._getNeededBuildingType(mockEconomy);
            expect(result).toBe('reactor');
        });

        test('должен вернуть тип с наименьшей эффективностью', () => {
            mockEconomy.buildings.mines = [{}];
            mockEconomy.buildings.reactors = [{}];
            mockEconomy.buildings.incubators = [{}];
            const result = autopilot._getNeededBuildingType(mockEconomy);
            expect(result).toBe('incubator');
        });
    });

    describe('_mutateLarvae', () => {
        const mockLarva = { guid: 'larva-1', x: 10, y: 20 };

        beforeEach(() => {
            mockEconomy.units.larvae = [mockLarva];
        });

        test('должен мутировать личинку в армейский юнит при приоритете army', () => {
            autopilot.addUnitRequests('sporomet', 2);
            autopilot.prioritet = 'army';
            
            autopilot._mutateLarvae(mockEconomy);
            
            expect(mockEconomy.spawnArmyUnit).toHaveBeenCalledTimes(1);
            expect(mockEconomy.spawnArmyUnit).toHaveBeenCalledWith({
                armyGuid: 'army-guid-123',
                type: 'sporomet',
                x: 10,
                y: 20,
            });
            expect(mockEconomy.resources.iron).toBe(90);
            expect(mockEconomy.resources.energy).toBe(85);
            expect(mockEconomy.units.larvae).toHaveLength(0);
        });

        test('не должен мутировать если недостаточно железа', () => {
            mockEconomy.resources.iron = 5;
            autopilot.addUnitRequests('sporomet', 1);
            autopilot.prioritet = 'army';
            
            autopilot._mutateLarvae(mockEconomy);
            expect(mockEconomy.spawnArmyUnit).not.toHaveBeenCalled();
        });

        test('не должен мутировать если недостаточно энергии', () => {
            mockEconomy.resources.energy = 10;
            autopilot.addUnitRequests('sporomet', 1);
            autopilot.prioritet = 'army';
            
            autopilot._mutateLarvae(mockEconomy);
            expect(mockEconomy.spawnArmyUnit).not.toHaveBeenCalled();
        });

        test('не должен мутировать при приоритете economy', () => {
            autopilot.addUnitRequests('sporomet', 1);
            autopilot.prioritet = 'economy';
            
            autopilot._mutateLarvae(mockEconomy);
            expect(mockEconomy.spawnArmyUnit).not.toHaveBeenCalled();
        });
    });

    describe('_mutateWorkers (режим ARMY)', () => {
        const mockWorker = { guid: 'worker-1' };

        beforeEach(() => {
            mockEconomy.units.workers = [mockWorker];
            autopilot.prioritet = 'army';
        });

        test('должен мутировать рабочего в большой реактор со стоимостью 60 железа', () => {
            autopilot.addBuildingRequests('reactor', 1);
            
            autopilot._mutateWorkers(mockEconomy);
            
            expect(mockEconomy.mutateWorkerToReactor).toHaveBeenCalledWith(mockWorker);
            expect(mockEconomy.resources.iron).toBe(40);
            expect(autopilot.requestsFromArmy.buildings).toHaveLength(0);
        });

        test('должен мутировать рабочего в малый реактор со стоимостью 30 железа', () => {
            autopilot.addBuildingRequests('small_reactor', 1);
            
            autopilot._mutateWorkers(mockEconomy);
            
            expect(mockEconomy.mutateWorkerToSmallReactor).toHaveBeenCalledWith(mockWorker);
            expect(mockEconomy.resources.iron).toBe(70);
        });

        test('не должен мутировать если недостаточно железа', () => {
            mockEconomy.resources.iron = 20;
            autopilot.addBuildingRequests('reactor', 1);
            
            autopilot._mutateWorkers(mockEconomy);
            expect(mockEconomy.mutateWorkerToReactor).not.toHaveBeenCalled();
        });
    });

    describe('_mutateWorkers (режим ECONOMY)', () => {
        const mockWorker = { guid: 'worker-1' };

        beforeEach(() => {
            mockEconomy.units.workers = [mockWorker];
            autopilot.prioritet = 'economy';
        });

        test('должен мутировать рабочего в малый реактор при необходимости', () => {
            jest.spyOn(autopilot, '_getNeededBuildingType').mockReturnValue('reactor');
            
            autopilot._mutateWorkers(mockEconomy);
            
            expect(mockEconomy.mutateWorkerToSmallReactor).toHaveBeenCalledWith(mockWorker);
            expect(mockEconomy.resources.iron).toBe(70);
        });

        test('должен мутировать рабочего в инкубатор при необходимости', () => {
            jest.spyOn(autopilot, '_getNeededBuildingType').mockReturnValue('incubator');
            
            autopilot._mutateWorkers(mockEconomy);
            
            expect(mockEconomy.mutateWorkerToIncubator).toHaveBeenCalledWith(mockWorker);
            expect(mockEconomy.resources.iron).toBe(60);
        });
    });

    describe('update', () => {
        test('должен вызывать все методы обновления в правильном порядке', () => {
            const updatePrioritySpy = jest.spyOn(autopilot, '_updatePriority');
            const mutateLarvaeSpy = jest.spyOn(autopilot, '_mutateLarvae');
            const mutateWorkersSpy = jest.spyOn(autopilot, '_mutateWorkers');

            autopilot.update(mockEconomy);
            
            expect(updatePrioritySpy).toHaveBeenCalled();
            expect(mutateLarvaeSpy).toHaveBeenCalledWith(mockEconomy);
            expect(mutateWorkersSpy).toHaveBeenCalledWith(mockEconomy);
        });
    });
});