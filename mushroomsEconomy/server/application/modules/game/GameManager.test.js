// GameManager.test.js
const GLOBAL_CONFIG = require('../../../../../global/globalConfig');
const CONFIG = require('../../../config');
const Answer = require('../../../../../global/Answer');

jest.mock('../../../../../global/modules/BaseManager', () => {
    return class MockBaseManager {
        constructor(options) {
            this.answer = options.answer;
            this.mediator = options.mediator;
            this.db = options.db;
            this.io = options.io;
            this.common = options.common;
            this.EVENTS = { 
                START_GAME: 'START_GAME', 
                LOAD_GAME: 'LOAD_GAME',
                DAMAGE: 'DAMAGE',
                MOVE_UNIT: 'MOVE_UNIT',
                REQUEST_UNITS: 'REQUEST_UNITS',
                REQUEST_BUILDINGS: 'REQUEST_BUILDINGS'
            };
            this.TRIGGERS = { GET_USER_BY_GUID: 'GET_USER_BY_GUID' };
            
            this.send = jest.fn().mockResolvedValue(null);
            this.sendToMap = jest.fn().mockResolvedValue(null);
            this.sendToMushroomsArmy = jest.fn().mockResolvedValue(null);
            this.sendToMushroomsEconomy = jest.fn().mockResolvedValue(null);
            this.sendToPeopleArmy = jest.fn().mockResolvedValue(null);
            this.sendToPeopleEconomy = jest.fn().mockResolvedValue(null);
        }
    };
});

const mockEconomyInstance = {
    get: jest.fn(() => ({ 
        guid: 'test-guid',
        buildings: { reactors: [], incubators: [], mycelium: [], mines: [] },
        units: { workers: [], larvae: [] },
        map: { relief: [[0, 0], [0, 0]], resources: [] },
        guids: { mapGuid: 'test-map-guid-456' }
    })),
    getUpdatedBuildings: jest.fn(() => []),
    getUpdatedUnits: jest.fn(() => []),
    setRelief: jest.fn(),
    setResources: jest.fn(),
    setVisibility: jest.fn(),
    applyDamage: jest.fn().mockReturnValue(true),
    moveUnitToNearestCell: jest.fn().mockReturnValue(true),
    autopilot: {
        addUnitRequests: jest.fn(),
        addBuildingRequests: jest.fn()
    },
    destructor: jest.fn()
};

const MockEconomy = jest.fn().mockImplementation(({ callbacks, guids, startPoint }) => {
    mockEconomyInstance._callbacks = callbacks;
    mockEconomyInstance._guids = guids;
    mockEconomyInstance._startPoint = startPoint;
    return mockEconomyInstance;
});

jest.mock('../../economy/Economy', () => MockEconomy);

const GameManager = require('./GameManager');

describe('GameManager', () => {
    let gameManager;
    let mockMediator;
    let mockIo;
    let mockAnswer;
    let mockCommon;
    let mockDb;

    const testGuid = 'test-user-guid-123';
    const testMapGuid = 'test-map-guid-456';
    const testSocketId = 'socket-id-789';

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockEconomyInstance.get.mockClear();
        mockEconomyInstance.getUpdatedBuildings.mockClear();
        mockEconomyInstance.getUpdatedUnits.mockClear();
        mockEconomyInstance.setRelief.mockClear();
        mockEconomyInstance.setResources.mockClear();
        mockEconomyInstance.setVisibility.mockClear();
        mockEconomyInstance.applyDamage.mockClear();
        mockEconomyInstance.moveUnitToNearestCell.mockClear();
        mockEconomyInstance.autopilot.addUnitRequests.mockClear();
        mockEconomyInstance.autopilot.addBuildingRequests.mockClear();
        mockEconomyInstance.destructor.mockClear();
        
        MockEconomy.mockClear();
        MockEconomy.mockReturnValue(mockEconomyInstance);

        mockMediator = {
            subscribe: jest.fn(),
            get: jest.fn(),
            getEventTypes: jest.fn(() => ({ 
                START_GAME: 'START_GAME', 
                LOAD_GAME: 'LOAD_GAME',
                DAMAGE: 'DAMAGE',
                MOVE_UNIT: 'MOVE_UNIT',
                REQUEST_UNITS: 'REQUEST_UNITS',
                REQUEST_BUILDINGS: 'REQUEST_BUILDINGS'
            })),
            getTriggerTypes: jest.fn(() => ({ GET_USER_BY_GUID: 'GET_USER_BY_GUID' }))
        };

        mockIo = {
            on: jest.fn(),
            to: jest.fn(() => mockIo),
            emit: jest.fn()
        };

        mockAnswer = new Answer();
        jest.spyOn(mockAnswer, 'good');
        jest.spyOn(mockAnswer, 'bad');

        mockCommon = {
            guid: jest.fn(() => 'generated-guid-123')
        };

        mockDb = {};

        gameManager = new GameManager({
            mediator: mockMediator,
            db: mockDb,
            io: mockIo,
            answer: mockAnswer,
            common: mockCommon
        });

        gameManager.sendToMap = jest.fn().mockResolvedValue(null);
        gameManager.sendToMushroomsArmy = jest.fn().mockResolvedValue(null);
    });

    describe('Constructor', () => {
        test('должен подписаться на события', () => {
            expect(mockMediator.subscribe).toHaveBeenCalledWith('START_GAME', expect.any(Function));
            expect(mockMediator.subscribe).toHaveBeenCalledWith('LOAD_GAME', expect.any(Function));
            expect(mockMediator.subscribe).toHaveBeenCalledWith('DAMAGE', expect.any(Function));
            expect(mockMediator.subscribe).toHaveBeenCalledWith('MOVE_UNIT', expect.any(Function));
            expect(mockMediator.subscribe).toHaveBeenCalledWith('REQUEST_UNITS', expect.any(Function));
            expect(mockMediator.subscribe).toHaveBeenCalledWith('REQUEST_BUILDINGS', expect.any(Function));
        });

        test('не должен создавать обработчики сокетов если io отсутствует', () => {
            const gameManagerWithoutIo = new GameManager({
                mediator: mockMediator,
                db: mockDb,
                io: null,
                answer: mockAnswer,
                common: mockCommon
            });
            expect(gameManagerWithoutIo).toBeDefined();
        });

        test('должен инициализировать пустой объект economies', () => {
            expect(gameManager.economies).toEqual({});
        });
    });

    describe('eventStartGame', () => {
        const validStartData = {
            guids: {
                mushroomsEconomy: testGuid,
                mushroomsArmy: 'army-guid',
                peopleEconomy: 'people-economy-guid',
                peopleArmy: 'people-army-guid',
                spectator: 'spectator-guid',
                mapGuid: testMapGuid
            },
            startPoint: { x: 10, y: 10 }
        };

        const mockUser = { guid: testGuid, socketId: testSocketId, name: 'Test User' };

        test('успешный сценарий: создает Economy и отправляет START_GAME клиенту', () => {
            mockMediator.get.mockReturnValue(mockUser);
            gameManager.getRelief = jest.fn().mockResolvedValue(undefined);

            const result = gameManager.eventStartGame(validStartData);

            expect(MockEconomy).toHaveBeenCalledWith({
                db: mockDb,
                common: mockCommon,
                callbacks: {
                    updated: expect.any(Function),
                    spawnArmyUnit: expect.any(Function)
                },
                guids: validStartData.guids,
                startPoint: validStartData.startPoint
            });

            expect(gameManager.economies[testGuid]).toBeDefined();
            expect(mockIo.to).toHaveBeenCalledWith(testSocketId);
            expect(mockIo.emit).toHaveBeenCalledWith(
                GLOBAL_CONFIG.SOCKET.START_GAME,
                mockAnswer.good(mockEconomyInstance.get())
            );
            expect(result).toEqual(mockAnswer.good(mockEconomyInstance.get()));
        });

        test('отсутствует guids.mushroomsEconomy - возвращает bad(4001)', () => {
            const invalidData = { guids: {}, startPoint: { x: 10, y: 10 } };
            const result = gameManager.eventStartGame(invalidData);
            expect(mockAnswer.bad).toHaveBeenCalledWith(4001);
            expect(result).toEqual(mockAnswer.bad(4001));
            expect(MockEconomy).not.toHaveBeenCalled();
        });

        test('пользователь не найден - возвращает bad(1001)', () => {
            mockMediator.get.mockReturnValue(null);
            const result = gameManager.eventStartGame(validStartData);
            expect(mockAnswer.bad).toHaveBeenCalledWith(1001);
            expect(result).toEqual(mockAnswer.bad(1001));
            expect(MockEconomy).not.toHaveBeenCalled();
        });

        test('пользователь найден но socketId отсутствует - не создает Economy и возвращает bad(1001)', () => {
            mockMediator.get.mockReturnValue({ ...mockUser, socketId: null });
            const result = gameManager.eventStartGame(validStartData);
            expect(MockEconomy).not.toHaveBeenCalled();
            expect(mockAnswer.bad).toHaveBeenCalledWith(1001);
            expect(result).toEqual(mockAnswer.bad(1001));
        });
    });

    describe('eventApplyDamage', () => {
        test('успешный сценарий: вызывает economy.applyDamage и возвращает answer.good', () => {
            gameManager.economies[testGuid] = mockEconomyInstance;
            const result = gameManager.eventApplyDamage({
                entityGuid: 'unit-123',
                damage: 25,
                mushroomsEconomy: testGuid,
            });
            expect(mockEconomyInstance.applyDamage).toHaveBeenCalledWith('unit-123', 25);
            expect(result).toEqual(mockAnswer.good(true));
        });

        test('экономика не существует - возвращает answer.bad(4002)', () => {
            const result = gameManager.eventApplyDamage({
                entityGuid: 'unit-123',
                damage: 25,
                mushroomsEconomy: 'non-existent',
            });
            expect(result).toEqual(mockAnswer.bad(4002));
        });
    });

    describe('eventMoveUnit', () => {
        test('успешный сценарий: вызывает economy.moveUnitToNearestCell', () => {
            gameManager.economies[testGuid] = mockEconomyInstance;
            const result = gameManager.eventMoveUnit({
                guid: 'unit-123',
                mushroomsEconomy: testGuid,
            });
            expect(mockEconomyInstance.moveUnitToNearestCell).toHaveBeenCalledWith('unit-123');
            expect(result).toEqual(mockAnswer.good(true));
        });

        test('экономика не существует - возвращает answer.bad(4003)', () => {
            const result = gameManager.eventMoveUnit({
                guid: 'unit-123',
                mushroomsEconomy: 'non-existent',
            });
            expect(result).toEqual(mockAnswer.bad(4003));
        });
    });

    describe('eventRequestUnits', () => {
        test('успешный сценарий: вызывает autopilot.addUnitRequests', () => {
            gameManager.economies[testGuid] = mockEconomyInstance;
            const result = gameManager.eventRequestUnits({
                mushroomsEconomy: testGuid,
                unitsType: 'sporomet',
                unitsAmount: 5,
            });
            expect(mockEconomyInstance.autopilot.addUnitRequests).toHaveBeenCalledWith('sporomet', 5);
            expect(result).toEqual(mockAnswer.good(true));
        });

        test('экономика не существует - возвращает answer.bad(4001)', () => {
            const result = gameManager.eventRequestUnits({
                mushroomsEconomy: 'non-existent',
                unitsType: 'sporomet',
                unitsAmount: 5,
            });
            expect(result).toEqual(mockAnswer.bad(4001));
        });
    });

    describe('eventRequestBuildings', () => {
        test('успешный сценарий: вызывает autopilot.addBuildingRequests', () => {
            gameManager.economies[testGuid] = mockEconomyInstance;
            const result = gameManager.eventRequestBuildings({
                mushroomsEconomy: testGuid,
                buildingsType: 'reactor',
                buildingsAmount: 2,
            });
            expect(mockEconomyInstance.autopilot.addBuildingRequests).toHaveBeenCalledWith('reactor', 2);
            expect(result).toEqual(mockAnswer.good(true));
        });

        test('экономика не существует - возвращает answer.bad(4001)', () => {
            const result = gameManager.eventRequestBuildings({
                mushroomsEconomy: 'non-existent',
                buildingsType: 'reactor',
                buildingsAmount: 2,
            });
            expect(result).toEqual(mockAnswer.bad(4001));
        });
    });

    describe('callbackUpdate', () => {
        const testData = {
            guids: { mushroomsEconomy: testGuid, mapGuid: testMapGuid },
            map: { relief: [[0, 0], [0, 0]] }
        };
        const mockUser = { guid: testGuid, socketId: testSocketId };

        beforeEach(() => {
            gameManager.economies[testGuid] = mockEconomyInstance;
            mockEconomyInstance.getUpdatedBuildings.mockReturnValue([]);
            mockEconomyInstance.getUpdatedUnits.mockReturnValue([]);
            gameManager.updateBuildings = jest.fn();
            gameManager.updateUnits = jest.fn();
            gameManager.getVisibility = jest.fn().mockResolvedValue(undefined);
            gameManager.getResources = jest.fn().mockResolvedValue(undefined);
        });

        test('успешный сценарий: вызывает методы обновления', () => {
            mockMediator.get.mockReturnValue(mockUser);
            
            gameManager.callbackUpdate(testData);
            
            expect(gameManager.getVisibility).toHaveBeenCalled();
            expect(gameManager.getResources).toHaveBeenCalled();
            expect(mockIo.to).toHaveBeenCalledWith(testSocketId);
            expect(mockIo.emit).toHaveBeenCalled();
        });

        test('пользователь не найден - выводит лог и возвращается', () => {
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
            mockMediator.get.mockReturnValue(null);
            
            expect(() => gameManager.callbackUpdate(testData)).not.toThrow();
            expect(consoleLogSpy).toHaveBeenCalled();
            expect(mockIo.emit).not.toHaveBeenCalled();
            
            consoleLogSpy.mockRestore();
        });
    });

    describe('getRelief', () => {
        const mockRelief = [[0, 0, 1], [0, 1, 1], [1, 1, 1]];
        const mockMap = { relief: mockRelief };

        beforeEach(() => {
            gameManager.economies[testGuid] = mockEconomyInstance;
        });

        test('успешный сценарий: получает рельеф и обновляет экономику', async () => {
            gameManager.sendToMap = jest.fn().mockResolvedValue(mockRelief);
            await gameManager.getRelief(mockMap, testGuid, testMapGuid);
            expect(mockEconomyInstance.setRelief).toHaveBeenCalledWith(mockRelief);
        });

        test('sendToMap вернул null - не вызывает setRelief', async () => {
            gameManager.sendToMap = jest.fn().mockResolvedValue(null);
            await gameManager.getRelief(mockMap, testGuid, testMapGuid);
            expect(mockEconomyInstance.setRelief).not.toHaveBeenCalled();
        });

        test('экономика не существует - не вызывает setRelief', async () => {
            gameManager.sendToMap = jest.fn().mockResolvedValue(mockRelief);
            await gameManager.getRelief(mockMap, 'non-existent-guid', testMapGuid);
            expect(mockEconomyInstance.setRelief).not.toHaveBeenCalled();
        });

        test('рельеф не является массивом массивов - возвращается без действий', async () => {
            const invalidMap = { relief: [[null]] };
            await gameManager.getRelief(invalidMap, testGuid, testMapGuid);
            expect(gameManager.sendToMap).not.toHaveBeenCalled();
        });
    });

    describe('getResources', () => {
        const mockMap = { relief: [[0, 0], [0, 0]] };
        const mockResources = {
            sources: [
                { x: 1, y: 1, type: 'iron', saturation: 10 },
                { x: 2, y: 3, type: 'fat', saturation: 5 }
            ]
        };

        beforeEach(() => {
            gameManager.economies[testGuid] = mockEconomyInstance;
        });

        test('успешный сценарий: получает ресурсы и обновляет экономику', async () => {
            gameManager.sendToMap = jest.fn().mockResolvedValue(mockResources);
            await gameManager.getResources(mockMap, testGuid, testMapGuid);
            expect(mockEconomyInstance.setResources).toHaveBeenCalledWith(mockResources.sources);
        });

        test('sendToMap вернул null - не вызывает setResources', async () => {
            gameManager.sendToMap = jest.fn().mockResolvedValue(null);
            await gameManager.getResources(mockMap, testGuid, testMapGuid);
            expect(mockEconomyInstance.setResources).not.toHaveBeenCalled();
        });

        test('экономика не существует - не вызывает setResources', async () => {
            gameManager.sendToMap = jest.fn().mockResolvedValue(mockResources);
            await gameManager.getResources(mockMap, 'non-existent-guid', testMapGuid);
            expect(mockEconomyInstance.setResources).not.toHaveBeenCalled();
        });
    });

    describe('getVisibility', () => {
        const mockMap = { relief: [[0, 0], [0, 0]] };
        const mockVisibility = {
            units: [{ guid: 'unit-1', x: 5, y: 5 }],
            buildings: [{ guid: 'bld-1', x: 3, y: 3 }]
        };

        beforeEach(() => {
            gameManager.economies[testGuid] = mockEconomyInstance;
        });

        test('успешный сценарий: получает видимость и обновляет экономику', async () => {
            gameManager.sendToMap = jest.fn().mockResolvedValue(mockVisibility);
            await gameManager.getVisibility(mockMap, testGuid, testMapGuid);
            expect(mockEconomyInstance.setVisibility).toHaveBeenCalledWith(mockVisibility);
        });

        test('sendToMap вернул null - не вызывает setVisibility', async () => {
            gameManager.sendToMap = jest.fn().mockResolvedValue(null);
            await gameManager.getVisibility(mockMap, testGuid, testMapGuid);
            expect(mockEconomyInstance.setVisibility).not.toHaveBeenCalled();
        });

        test('экономика не существует - не вызывает setVisibility', async () => {
            gameManager.sendToMap = jest.fn().mockResolvedValue(mockVisibility);
            await gameManager.getVisibility(mockMap, 'non-existent-guid', testMapGuid);
            expect(mockEconomyInstance.setVisibility).not.toHaveBeenCalled();
        });
    });

    describe('updateBuildings', () => {
        test('вызывает sendToMap с правильными параметрами', () => {
            const guids = { mushroomsEconomy: testGuid, mapGuid: testMapGuid };
            const buildings = [{ x: 1, y: 1, type: 'mycelium', guid: 'bld-1' }];
            
            gameManager.updateBuildings(guids, buildings);
            
            expect(gameManager.sendToMap).toHaveBeenCalledWith(
                GLOBAL_CONFIG.URLS.UPDATE_BUILDINGS,
                { mapGuid: testMapGuid, userGuid: testGuid, entities: buildings }
            );
        });

        test('не вызывает sendToMap если buildings пуст', () => {
            const guids = { mushroomsEconomy: testGuid, mapGuid: testMapGuid };
            gameManager.updateBuildings(guids, []);
            expect(gameManager.sendToMap).not.toHaveBeenCalled();
        });
    });

    describe('updateUnits', () => {
        test('вызывает sendToMap с правильными параметрами', () => {
            const guids = { mushroomsEconomy: testGuid, mapGuid: testMapGuid };
            const units = [{ guid: 'unit-1', x: 5, y: 5, type: 'worker' }];
            
            gameManager.updateUnits(guids, units);
            
            expect(gameManager.sendToMap).toHaveBeenCalledWith(
                GLOBAL_CONFIG.URLS.UPDATE_UNITS,
                { mapGuid: testMapGuid, userGuid: testGuid, entities: units }
            );
        });

        test('не вызывает sendToMap если units пуст', () => {
            const guids = { mushroomsEconomy: testGuid, mapGuid: testMapGuid };
            gameManager.updateUnits(guids, []);
            expect(gameManager.sendToMap).not.toHaveBeenCalled();
        });
    });

    describe('spawnArmyUnit', () => {
        test('вызывает sendToMushroomsArmy с правильными параметрами', () => {
            const spawnData = { 
                unitType: GLOBAL_CONFIG.UNIT_TYPES.MUSHROOMS_ARMY.CHAMPIGNEB, 
                x: 5, 
                y: 5, 
                armyGuid: 'army-guid-123' 
            };
            gameManager.spawnArmyUnit(spawnData);
            expect(gameManager.sendToMushroomsArmy).toHaveBeenCalledWith(GLOBAL_CONFIG.URLS.SPAWN_UNIT, spawnData);
        });
    });
});