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
                APPLY_DAMAGE: 'APPLY_DAMAGE'
            };
            this.TRIGGERS = { GET_USER_BY_GUID: 'GET_USER_BY_GUID' };
            this.SOCKET = {
                UPDATE_SCENE: 'UPDATE_SCENE',
                START_GAME: 'START_GAME'
            };
            
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
        buildings: { smallReactors: [], incubators: [], mycelium: [] },
        units: { workers: [], larvae: [] },
        map: []
    })),
    setRelief: jest.fn(),
    setResources: jest.fn(),
    applyDamage: jest.fn().mockReturnValue(true),
    getUpdatedBuildings: jest.fn(() => []),
    getUpdatedUnits: jest.fn(() => []),
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
        mockEconomyInstance.setRelief.mockClear();
        mockEconomyInstance.setResources.mockClear();
        mockEconomyInstance.applyDamage.mockClear();
        mockEconomyInstance.getUpdatedBuildings.mockClear();
        mockEconomyInstance.getUpdatedUnits.mockClear();
        mockEconomyInstance.destructor.mockClear();
        
        MockEconomy.mockClear();
        MockEconomy.mockReturnValue(mockEconomyInstance);

        mockMediator = {
            subscribe: jest.fn(),
            get: jest.fn(),
            getEventTypes: jest.fn(() => ({ 
                START_GAME: 'START_GAME', 
                LOAD_GAME: 'LOAD_GAME',
                APPLY_DAMAGE: 'APPLY_DAMAGE'
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

        gameManager.SOCKET = GLOBAL_CONFIG.SOCKET;
        gameManager.sendToMap = jest.fn().mockResolvedValue(null);
        gameManager.sendToMushroomsArmy = jest.fn().mockResolvedValue(null);
    });

    describe('Constructor', () => {
        test('должен подписаться на событие START_GAME', () => {
            expect(mockMediator.subscribe).toHaveBeenCalledWith('START_GAME', expect.any(Function));
        });

        test('должен подписаться на событие LOAD_GAME', () => {
            expect(mockMediator.subscribe).toHaveBeenCalledWith('LOAD_GAME', expect.any(Function));
        });

        test('должен подписаться на событие DAMAGE', () => {
            expect(mockMediator.subscribe).toHaveBeenCalledWith('DAMAGE', expect.any(Function));
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
                mockEconomyInstance.get()
            );
            expect(result).toEqual(mockEconomyInstance.get());
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

        test('пользователь найден но socketId отсутствует - НЕ создает Economy и возвращает bad(1001)', () => {
            mockMediator.get.mockReturnValue({ ...mockUser, socketId: null });
            const result = gameManager.eventStartGame(validStartData);
            expect(MockEconomy).not.toHaveBeenCalled();
            expect(mockAnswer.bad).toHaveBeenCalledWith(1001);
            expect(result).toEqual(mockAnswer.bad(1001));
        });
    });

    describe('eventApplyDamage', () => {
        test('успешный сценарий: вызывает economy.applyDamage и возвращает true', () => {
            gameManager.economies[testGuid] = mockEconomyInstance;
            mockEconomyInstance.applyDamage.mockReturnValue(true);
            const result = gameManager.eventApplyDamage({
                entityGuid: 'unit-123',
                damage: 25,
                mushroomsEconomy: testGuid,
            });
            expect(mockEconomyInstance.applyDamage).toHaveBeenCalledWith('unit-123', 25);
            expect(result).toBe(true);
        });

        test('экономика не существует - возвращает 4001', () => {
            const result = gameManager.eventApplyDamage({
                entityGuid: 'unit-123',
                damage: 25,
                mushroomsEconomy: 'non-existent',
            });
            expect(result).toBe(4001);
        });

        test('цель не найдена - возвращает 4003', () => {
            gameManager.economies[testGuid] = mockEconomyInstance;
            mockEconomyInstance.applyDamage.mockReturnValue(false);
            const result = gameManager.eventApplyDamage({
                entityGuid: 'unit-123',
                damage: 25,
                mushroomsEconomy: testGuid,
            });
            expect(result).toBe(4003);
        });
    });

    describe('callbackUpdate', () => {
        const testData = {
            guids: { mushroomsEconomy: testGuid, mapGuid: testMapGuid, spectator: 'spectator-guid' },
            some: 'data'
        };
        const mockUser = { guid: testGuid, socketId: testSocketId };

        beforeEach(() => {
            gameManager.economies[testGuid] = mockEconomyInstance;
            gameManager.getRelief = jest.fn().mockResolvedValue(undefined);
        });

        test('успешный сценарий: синхронизирует карту и отправляет клиенту', async () => {
            mockMediator.get.mockReturnValue(mockUser);
            gameManager.getVisibility = jest.fn().mockResolvedValue(undefined);
            gameManager.getResources = jest.fn().mockResolvedValue(undefined);
            await gameManager.callbackUpdate(testData);
            expect(mockEconomyInstance.getUpdatedBuildings).toHaveBeenCalled();
            expect(mockIo.emit).toHaveBeenCalledWith(CONFIG.SOCKET.UPDATE_SCENE, expect.objectContaining({ result: 'ok' }));
        });

        test('пользователь не найден - выводит лог и возвращается', async () => {
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
            mockMediator.get.mockReturnValue(null);
            await expect(gameManager.callbackUpdate(testData)).resolves.toBeUndefined();
            expect(consoleLogSpy).toHaveBeenCalled();
            consoleLogSpy.mockRestore();
        });
    });

    describe('getRelief', () => {
        const mockRelief = [[0, 0, 1], [0, 1, 1], [1, 1, 1]];

        beforeEach(() => {
            gameManager.economies[testGuid] = mockEconomyInstance;
        });

        test('успешный сценарий: получает рельеф и обновляет экономику', async () => {
            gameManager.sendToMap.mockResolvedValue(mockRelief);
            await gameManager.getRelief(testGuid, testMapGuid);
            expect(mockEconomyInstance.setRelief).toHaveBeenCalledWith(mockRelief);
        });

        test('sendToMap вернул null - не вызывает setRelief', async () => {
            gameManager.sendToMap.mockResolvedValue(null);
            await gameManager.getRelief(testGuid, testMapGuid);
            expect(mockEconomyInstance.setRelief).not.toHaveBeenCalled();
        });

        test('экономика не существует - не вызывает setRelief', async () => {
            gameManager.sendToMap.mockResolvedValue(mockRelief);
            await gameManager.getRelief('non-existent-guid', testMapGuid);
            expect(mockEconomyInstance.setRelief).not.toHaveBeenCalled();
        });
    });

    describe('getResources', () => {
        const mockResources = {
            sources: [
                { x: 1, y: 1, type: 'iron', saturation: 10 },
                { x: 2, y: 3, type: 'fat', saturation: 5 }
            ]
        };
        const mockUser = { guid: testGuid, socketId: testSocketId };

        beforeEach(() => {
            gameManager.economies[testGuid] = mockEconomyInstance;
        });

        test('успешный сценарий: получает ресурсы, обновляет экономику, отправляет клиенту', async () => {
            mockMediator.get.mockReturnValue(mockUser);
            gameManager.sendToMap.mockResolvedValue(mockResources);

            const result = await gameManager.getResources(testGuid, testMapGuid);

            expect(mockEconomyInstance.setResources).toHaveBeenCalledWith(mockResources);
            expect(mockIo.emit).toHaveBeenCalledWith(CONFIG.SOCKET.UPDATE_SCENE, expect.objectContaining({ result: 'ok' }));
            expect(result).toEqual({ result: 'ok', data: mockResources });
        });

        test('пользователь не найден - возвращает bad(1002)', async () => {
            mockMediator.get.mockReturnValue(null);
            const result = await gameManager.getResources(testGuid, testMapGuid);
            expect(mockAnswer.bad).toHaveBeenCalledWith(1002);
            expect(result).toEqual(mockAnswer.bad(1002));
        });

        test('экономика не существует - setResources не вызывается, но emit происходит', async () => {
            const newGuid = 'economy-not-exists';
            mockMediator.get.mockReturnValue({ ...mockUser, guid: newGuid });
            gameManager.sendToMap.mockResolvedValue(mockResources);
            delete gameManager.economies[newGuid];
            
            await gameManager.getResources(newGuid, testMapGuid);
            expect(mockEconomyInstance.setResources).not.toHaveBeenCalled();
            expect(mockIo.emit).toHaveBeenCalled();
        });

        test('sendToMap вернул null - передает null в setResources и клиенту', async () => {
            mockMediator.get.mockReturnValue(mockUser);
            gameManager.sendToMap.mockResolvedValue(null);
            await gameManager.getResources(testGuid, testMapGuid);
            expect(mockEconomyInstance.setResources).toHaveBeenCalledWith(null);
        });
    });

    describe('updateBuildings', () => {
        test('вызывает sendToMap с правильными параметрами', async () => {
            const guids = { mapGuid: testMapGuid, mushroomsEconomy: testGuid };
            const buildings = [{ x: 1, y: 1, type: 'mycelium', guid: 'bld-1' }];
            await gameManager.updateBuildings(guids, buildings);
            expect(gameManager.sendToMap).toHaveBeenCalledWith(
                GLOBAL_CONFIG.URLS.UPDATE_BUILDINGS,
                { mapGuid: testMapGuid, userGuid: testGuid, entities: buildings }
            );
        });
    });

    describe('spawnArmyUnit', () => {
        test('вызывает sendToMushroomsArmy с правильными параметрами', () => {
            const spawnData = { unitType: GLOBAL_CONFIG.UNIT_TYPES.MUSHROOMS_ARMY.CHAMPIGNEB, x: 5, y: 5, armyGuid: 'army-guid-123' };
            gameManager.spawnArmyUnit(spawnData);
            expect(gameManager.sendToMushroomsArmy).toHaveBeenCalledWith(GLOBAL_CONFIG.URLS.SPAWN_UNIT, spawnData);
        });
    });

    describe('Интеграционные сценарии', () => {
        test('полный цикл: startGame -> callbackUpdate -> getResources', async () => {
            const mockUser = { guid: testGuid, socketId: testSocketId };
            const startData = {
                guids: { mushroomsEconomy: testGuid, mapGuid: testMapGuid, spectator: 'spectator-guid' },
                startPoint: { x: 5, y: 5 }
            };

            mockMediator.get.mockReturnValue(mockUser);
            gameManager.sendToMap.mockResolvedValue({ sources: [] });
            gameManager.getRelief = jest.fn().mockResolvedValue(undefined);
            
            gameManager.eventStartGame(startData);
            expect(gameManager.economies[testGuid]).toBeDefined();
            
            gameManager.callbackUpdate({ guids: { mushroomsEconomy: testGuid, mapGuid: testMapGuid } });
            expect(gameManager.getRelief).toHaveBeenCalled();
            
            await gameManager.getResources(testGuid, testMapGuid);
            expect(mockIo.emit).toHaveBeenCalledTimes(3);
        });
    });
});