const EasyStar = require('easystarjs');
const Building = require('./entities/Buildings/Building');

jest.mock('../../../../global/globalConfig', () => ({
    INTERVAL: 200,
    MAP_SIZE: 100,
    UNIT_TYPES: {
        MUSHROOMS_ARMY: {
            SPOROMET: 'sporomet',
            CHAMPIGNEB: 'champigneb',
            EBLEKAR: 'eblekar',
        },
    },
}));

jest.mock('../../config', () => ({
    ECONOMY: {
        MYCELIUM: {
            HP: 1,
            GROW_SPEED: 200,
            GROW_LEVEL_UP: 2000,
            MAX_LEVEL: 3,
            CONSUMPTION: 0,
            PRODUCTION: 30,
            CAPACITY: 0,
            POWER: 1,
            SIZE: 1,
            VISIBILITY: 1,
            IRON_COST: 0,
        },
        MINE: { PRODUCTION: 1, IRON_COST: 20 },
        BIO_REACTOR_SMALL: { TYPE: 'small_reactor', PRODUCTION: 3, IRON_COST: 30 },
        BIO_REACTOR: { TYPE: 'reactor', PRODUCTION: 5, IRON_COST: 60 },
        INCUBATOR: { PRODUCTION: 1, IRON_COST: 40 },
        LARVA: { 
            MUTATION_IRON_COST: 10, 
            MUTATION_ENERGY_COST: 15, 
            GROWTH_LIMIT: 100,
            HP: 40,
            SPEED: 0.05,
            TYPE: 'larva',
            VISIBILITY: 2,
            SOURCES_VISIBILITY: 100,
        },
        WORKER: { 
            HP: 60, 
            SPEED: 0.08, 
            TYPE: 'worker', 
            VISIBILITY: 4, 
            WANDER_RADIUS: 8, 
            SOURCES_VISIBILITY: 3 
        },
    },
}));

jest.mock('./entities/Buildings/Mycelium');
jest.mock('./entities/Buildings/SmallReactor');
jest.mock('./entities/Buildings/Reactor');
jest.mock('./entities/Buildings/Incubator');
jest.mock('./entities/Unit/Worker');
jest.mock('./entities/Buildings/Mine');
jest.mock('./entities/Unit/Larva');
jest.mock('./entities/Map/Map');
jest.mock('./Autopilot');

const Economy = require('./Economy');

describe('Pathfinding Tests', () => {
    let economy;
    let easyStar;
    let testGrid;

    beforeEach(() => {
        easyStar = new EasyStar.js();
        testGrid = [
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
        ];
        easyStar.setGrid(testGrid);
        easyStar.setAcceptableTiles([1]);

        const mockDb = { get: jest.fn(), set: jest.fn() };
        const mockCommon = { guid: jest.fn(() => 'test-guid') };
        const mockCallbacks = { updated: jest.fn(), spawnArmyUnit: jest.fn() };
        const mockGuids = {
            spectator: null,
            peopleArmy: null,
            peopleEconomy: null,
            mushroomsArmy: 'army-guid',
            mushroomsEconomy: 'economy-guid',
            mapGuid: null,
        };

        economy = new Economy({
            db: mockDb,
            common: mockCommon,
            callbacks: mockCallbacks,
            guids: mockGuids,
            startPoint: { x: 93, y: 93 },
        });
        
        economy.map.myceliumGrid = testGrid;
    });

    afterEach(() => {
        if (economy.destructor) {
            economy.destructor();
        }
    });

    describe('Building.hasPathTo', () => {
        test('должен найти путь между двумя точками', async () => {
            const building = new Building({
                type: 'test',
                guid: 'b1',
                x: 0,
                y: 0,
            });
            building.easyStar = easyStar;

            const hasPath = await building.hasPathTo(testGrid, { x: 4, y: 4 });
            expect(hasPath).toBe(true);
        });

        test('должен вернуть false если путь заблокирован', async () => {
            const blockedGrid = [
                [1, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 1],
            ];
            
            const building = new Building({
                type: 'test',
                guid: 'b1',
                x: 0,
                y: 0,
            });
            building.easyStar = easyStar;

            const hasPath = await building.hasPathTo(blockedGrid, { x: 4, y: 4 });
            expect(hasPath).toBe(false);
        });

        test('должен вернуть false если грид отсутствует', async () => {
            const building = new Building({
                type: 'test',
                guid: 'b1',
                x: 0,
                y: 0,
            });
            building.easyStar = easyStar;

            const hasPath = await building.hasPathTo(null, { x: 2, y: 2 });
            expect(hasPath).toBe(false);
        });
    });

    describe('Economy.checkConnection', () => {
        test('должен вернуть false если нет myceliumGrid', () => {
            economy.map.myceliumGrid = null;
            
            const building1 = { x: 0, y: 0 };
            const building2 = { x: 2, y: 2 };
            
            const result = economy.checkConnection(building1, building2);
            expect(result).toBe(false);
        });
    });

    describe('Economy.getAvailableEnergy', () => {
        test('должен вернуть 0 если нет реакторов', () => {
            economy.buildings.reactors = [];
            const result = economy.getAvailableEnergy();
            expect(result).toBe(0);
        });
    });

    describe('Economy.consumeEnergyFromReactors', () => {
        test('не должен падать если реакторов нет', () => {
            economy.buildings.reactors = [];
            expect(() => economy.consumeEnergyFromReactors(100)).not.toThrow();
        });
    });

    describe('Economy.updateMyceliumGrid', () => {
        test('должен корректно построить сетку из позиций мицелия', () => {
            economy.buildings.mycelium = [
                { x: 1, y: 1 },
                { x: 3, y: 2 },
                { x: 0, y: 4 },
            ];
            
            economy.map.updateMyceliumGrid(economy.buildings.mycelium);
            
            expect(economy.map.myceliumGrid).toBeDefined();
        });
    });

    describe('Economy basic methods', () => {
        test('get возвращает корректную структуру', () => {
            const result = economy.get();
            expect(result).toHaveProperty('guids');
            expect(result).toHaveProperty('resources');
            expect(result).toHaveProperty('units');
            expect(result).toHaveProperty('buildings');
            expect(result).toHaveProperty('enemyBuildings');
            expect(result).toHaveProperty('enemyUnits');
            expect(result).toHaveProperty('map');
            expect(result).toHaveProperty('priority');
        });

        test('addLarva добавляет личинку', () => {
            const initialCount = economy.units.larvae.length;
            economy.addLarva(10, 10, 10, 10);
            expect(economy.units.larvae.length).toBe(initialCount + 1);
        });

        test('addWorker добавляет рабочего', () => {
            const initialCount = economy.units.workers.length;
            economy.addWorker(5, 5);
            expect(economy.units.workers.length).toBe(initialCount + 1);
        });

        test('addMine добавляет шахту', () => {
            const initialCount = economy.buildings.mines.length;
            economy.addMine(3, 3);
            expect(economy.buildings.mines.length).toBe(initialCount + 1);
        });

        test('addSmallReactor добавляет малый реактор', () => {
            const initialCount = economy.buildings.reactors.length;
            economy.addSmallReactor(2, 2);
            expect(economy.buildings.reactors.length).toBe(initialCount + 1);
        });

        test('addReactor добавляет большой реактор', () => {
            const initialCount = economy.buildings.reactors.length;
            economy.addReactor(2, 2);
            expect(economy.buildings.reactors.length).toBe(initialCount + 1);
        });

        test('addIncubator добавляет инкубатор', () => {
            const initialCount = economy.buildings.incubators.length;
            economy.addIncubator(1, 1);
            expect(economy.buildings.incubators.length).toBe(initialCount + 1);
        });

        test('addMycelium добавляет мицелий', () => {
            const initialCount = economy.buildings.mycelium.length;
            economy.addMycelium(4, 4);
            expect(economy.buildings.mycelium.length).toBe(initialCount + 1);
        });
    });
});

describe('Building (публичные методы)', () => {
    test('get() должен возвращать только публичные поля', () => {
        const building = new Building({
            type: 'factory',
            guid: 'f123',
            x: 10,
            y: 20,
            hp: 500,
            size: 3,
            consumption: 50,
            production: 100,
            capacity: 1000,
        });

        const result = building.get();
        
        expect(result).toMatchObject({
            guid: 'f123',
            type: 'factory',
            hp: 500,
            size: 3,
        });
        expect(result.x).toBe(10);
        expect(result.y).toBe(20);
    });

    test('геттеры возвращают корректные значения', () => {
        const building = new Building({
            type: 'test',
            guid: 't1',
            x: 0,
            y: 0,
            production: 777,
            consumption: 888,
            capacity: 999,
        });

        expect(building.getProduction()).toBe(777);
        expect(building.getConsumption()).toBe(888);
        expect(building.getCapacity()).toBe(999);
    });
});