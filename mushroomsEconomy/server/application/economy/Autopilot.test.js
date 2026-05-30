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
            buildings: { 
                mines: [], 
                reactors: [], 
                incubators: [] 
            },
            guids: { mushroomsArmy: 'army-guid-123' },
            spawnArmyUnit: jest.fn(),
            updated: false,
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

    describe('_getIronPerTick', () => {
        test('должен рассчитывать производство железа', () => {
            mockEconomy.buildings.mines = [{}, {}, {}];
            const production = autopilot._getIronPerTick(mockEconomy);
            expect(production).toBe(6);
        });

        test('должен вернуть 0 когда нет шахт', () => {
            mockEconomy.buildings.mines = [];
            const production = autopilot._getIronPerTick(mockEconomy);
            expect(production).toBe(0);
        });
    });

    describe('_getEnergyPerTick', () => {
        test('должен рассчитывать производство энергии', () => {
            mockEconomy.buildings.reactors = [
                { type: 'reactor' },
                { type: 'small_reactor' },
                { type: 'reactor' },
            ];
            const production = autopilot._getEnergyPerTick(mockEconomy);
            expect(production).toBe(13);
        });

        test('должен вернуть 0 когда нет реакторов', () => {
            mockEconomy.buildings.reactors = [];
            const production = autopilot._getEnergyPerTick(mockEconomy);
            expect(production).toBe(0);
        });
    });

    describe('_updatePriority', () => {
        test('должен установить приоритет army когда есть запросы и экономика готова', () => {
            mockEconomy.buildings.mines = [{}, {}];
            mockEconomy.buildings.reactors = [{ type: 'reactor' }, { type: 'small_reactor' }];
            autopilot.addUnitRequests('sporomet', 2);
            
            autopilot._updatePriority(mockEconomy);
            expect(autopilot.priority).toBe('army');
        });

        test('должен установить приоритет economy когда запросов нет', () => {
            autopilot._updatePriority(mockEconomy);
            expect(autopilot.priority).toBe('economy');
        });
    });

    describe('_getSmallReactorEquivalent', () => {
        test('должен вернуть 1 для малого реактора', () => {
            const result = autopilot._getSmallReactorEquivalent({ type: 'small_reactor' });
            expect(result).toBe(1);
        });

        test('должен вернуть 2 для большого реактора', () => {
            const result = autopilot._getSmallReactorEquivalent({ type: 'reactor' });
            expect(result).toBe(2);
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

        test('должен вернуть reactor когда соотношение наименьшее', () => {
            mockEconomy.buildings.mines = [{}];
            mockEconomy.buildings.reactors = [{ type: 'small_reactor' }];
            mockEconomy.buildings.incubators = [{}];
            const result = autopilot._getNeededBuildingType(mockEconomy);
            expect(result).toBe('reactor');
        });
    });

    describe('_mutateLarvae', () => {
        const mockLarva = { guid: 'larva-1', x: 10, y: 20 };

        beforeEach(() => {
            mockEconomy.units.larvae = [mockLarva];
        });

        test('должен мутировать личинку в армейский юнит при приоритете army', () => {
            autopilot.addUnitRequests('sporomet', 2);
            autopilot.priority = 'army';
            
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
            autopilot.priority = 'army';
            
            autopilot._mutateLarvae(mockEconomy);
            expect(mockEconomy.spawnArmyUnit).not.toHaveBeenCalled();
        });

        test('не должен мутировать если недостаточно энергии', () => {
            mockEconomy.resources.energy = 10;
            autopilot.addUnitRequests('sporomet', 1);
            autopilot.priority = 'army';
            
            autopilot._mutateLarvae(mockEconomy);
            expect(mockEconomy.spawnArmyUnit).not.toHaveBeenCalled();
        });

        test('не должен мутировать при приоритете economy', () => {
            autopilot.addUnitRequests('sporomet', 1);
            autopilot.priority = 'economy';
            
            autopilot._mutateLarvae(mockEconomy);
            expect(mockEconomy.spawnArmyUnit).not.toHaveBeenCalled();
        });
    });

    describe('_assignWorkers (режим ARMY)', () => {
        const mockWorker = { guid: 'worker-1', assignedBuilding: null };

        beforeEach(() => {
            mockEconomy.units.workers = [mockWorker];
            autopilot.priority = 'army';
        });

        test('должен назначить рабочему задание построить реактор', () => {
            autopilot.addBuildingRequests('reactor', 1);
            
            autopilot._assignWorkers(mockEconomy);
            
            expect(mockWorker.assignedBuilding).toBe('reactor');
            expect(autopilot.requestsFromArmy.buildings).toHaveLength(0);
        });

        test('должен назначить рабочему задание построить малый реактор', () => {
            autopilot.addBuildingRequests('small_reactor', 1);
            
            autopilot._assignWorkers(mockEconomy);
            
            expect(mockWorker.assignedBuilding).toBe('small_reactor');
        });

        test('не должен назначать если недостаточно железа', () => {
            mockEconomy.resources.iron = 20;
            autopilot.addBuildingRequests('reactor', 1);
            
            autopilot._assignWorkers(mockEconomy);
            expect(mockWorker.assignedBuilding).toBeNull();
        });
    });

    describe('_assignWorkers (режим ECONOMY)', () => {
        const mockWorker = { guid: 'worker-1', assignedBuilding: null };

        beforeEach(() => {
            mockEconomy.units.workers = [mockWorker];
            autopilot.priority = 'economy';
            mockEconomy.buildings.mines = [{}];
            mockEconomy.buildings.reactors = [{ type: 'small_reactor' }];
            mockEconomy.buildings.incubators = [];
        });

        test('должен назначить рабочему задание на основе потребности', () => {
            autopilot._assignWorkers(mockEconomy);
            
            expect(mockWorker.assignedBuilding).toBe('incubator');
        });
    });

    describe('update', () => {
        test('должен вызывать все методы обновления в правильном порядке', () => {
            const updatePrioritySpy = jest.spyOn(autopilot, '_updatePriority');
            const mutateLarvaeSpy = jest.spyOn(autopilot, '_mutateLarvae');
            const assignWorkersSpy = jest.spyOn(autopilot, '_assignWorkers');

            autopilot.update(mockEconomy);
            
            expect(updatePrioritySpy).toHaveBeenCalledWith(mockEconomy);
            expect(mutateLarvaeSpy).toHaveBeenCalledWith(mockEconomy);
            expect(assignWorkersSpy).toHaveBeenCalledWith(mockEconomy);
        });
    });
});