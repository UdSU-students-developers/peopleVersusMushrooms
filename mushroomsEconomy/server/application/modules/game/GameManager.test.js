const GLOBAL_CONFIG = require('../../../../../global/globalConfig');
const Answer = require('../../../../../global/Answer');

//Мок для BaseManager
jest.mock('../../../../../global/modules/BaseManager', () => {
    return class MockBaseManager {
        constructor(options) {
            this.answer = options.answer;
            this.mediator = options.mediator;
            this.db = options.db;
            this.io = options.io;
            this.common = options.common;
            this.EVENTS = { START_GAME: 'START_GAME', LOAD_GAME: 'LOAD_GAME' };
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

//Мок для Economy
const mockEconomyInstance = {
    get: jest.fn(() => ({ 
        guid: 'test-guid',
        buildings: { smallReactors: [], incubators: [], mycelium: [] },
        units: { workers: [], larvae: [] },
        map: []
    })),
    setRelief: jest.fn(),
    setResources: jest.fn(),
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
        mockEconomyInstance.destructor.mockClear();
        
        MockEconomy.mockClear();
        MockEconomy.mockReturnValue(mockEconomyInstance);

        mockMediator = {
            subscribe: jest.fn(),
            get: jest.fn(),
            getEventTypes: jest.fn(() => ({ START_GAME: 'START_GAME', LOAD_GAME: 'LOAD_GAME' })),
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
            expect(mockMediator.subscribe).toHaveBeenCalledWith(
                'START_GAME',
                expect.any(Function)
            );
        });

        test('должен подписаться на событие LOAD_GAME', () => {
            expect(mockMediator.subscribe).toHaveBeenCalledWith(
                'LOAD_GAME',
                expect.any(Function)
            );
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
                spectator: 'spectator-guid'
            },
            startPoint: { x: 10, y: 10 },
            mapGuid: testMapGuid
        };

        const mockUser = {
            guid: testGuid,
            socketId: testSocketId,
            name: 'Test User'
        };

        test('успешный сценарий: создает Economy и отправляет START_GAME клиенту', () => {
            mockMediator.get.mockReturnValue(mockUser);
            gameManager.sendToMap.mockResolvedValue(null);

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
                expect.objectContaining({ result: 'ok' })
            );
            expect(gameManager.sendToMap).toHaveBeenCalled();
            expect(result).toEqual({ result: 'ok', data: true });
        });

        test('отсутствует guids.mushroomsEconomy - возвращает bad(4001)', () => {
            const invalidData = {
                guids: {},
                startPoint: { x: 10, y: 10 },
                mapGuid: testMapGuid
            };

            const result = gameManager.eventStartGame(invalidData);

            expect(mockAnswer.bad).toHaveBeenCalledWith(4001);
            expect(result).toEqual(mockAnswer.bad(4001));
            expect(MockEconomy).not.toHaveBeenCalled();
        });

        test('пользователь не найден - возвращает bad(1001)', () => {
            mockMediator.get.mockReturnValue(null);

            const result = gameManager.eventStartGame(validStartData);

            expect(mockMediator.get).toHaveBeenCalledWith(
                gameManager.TRIGGERS.GET_USER_BY_GUID,
                testGuid
            );
            expect(mockAnswer.bad).toHaveBeenCalledWith(1001);
            expect(result).toEqual(mockAnswer.bad(1001));
            expect(MockEconomy).not.toHaveBeenCalled();
        });

        test('пользователь найден но socketId отсутствует - создает Economy и отправляет START_GAME с null socketId', () => {
            const userWithoutSocket = { ...mockUser, socketId: null };
            mockMediator.get.mockReturnValue(userWithoutSocket);
            gameManager.sendToMap.mockResolvedValue(null);

            const result = gameManager.eventStartGame(validStartData);

            expect(MockEconomy).toHaveBeenCalled();
            expect(gameManager.economies[testGuid]).toBeDefined();
            expect(result).toEqual({ result: 'ok', data: true });
            expect(mockIo.to).toHaveBeenCalledWith(null);
            expect(mockIo.emit).toHaveBeenCalled();
        });
    });

    describe('callbackUpdate', () => {
        const testData = { some: 'data', x: 10, y: 20 };
        const mockRelief = [
            [0, 0, 1, 1, 0],
            [0, 1, 1, 1, 0],
            [1, 1, 1, 1, 1]
        ];
        const mockUser = {
            guid: testGuid,
            socketId: testSocketId
        };

        beforeEach(() => {
            gameManager.economies[testGuid] = mockEconomyInstance;
        });

        test('успешный сценарий: получает рельеф, обновляет экономику, отправляет клиенту', async () => {
            mockMediator.get.mockReturnValue(mockUser);
            gameManager.sendToMap.mockResolvedValue(mockRelief);

            await gameManager.callbackUpdate(testGuid, testMapGuid, testData);

            expect(mockMediator.get).toHaveBeenCalledWith(
                gameManager.TRIGGERS.GET_USER_BY_GUID,
                testGuid
            );

            expect(gameManager.sendToMap).toHaveBeenCalledWith(
                GLOBAL_CONFIG.URLS.GET_RELIEF,
                { mapGuid: testMapGuid, userGuid: testGuid }
            );

            expect(mockEconomyInstance.setRelief).toHaveBeenCalledWith(mockRelief);

            expect(mockIo.to).toHaveBeenCalledWith(testSocketId);
            expect(mockIo.emit).toHaveBeenCalledWith(
                GLOBAL_CONFIG.SOCKET.UPDATE_SCENE,
                expect.objectContaining({
                    result: 'ok',
                    data: expect.objectContaining({
                        some: 'data',
                        relief: mockRelief
                    })
                })
            );
        });

        test('sendToMap вернул null - отправляет ответ с relief=null', async () => {
            mockMediator.get.mockReturnValue(mockUser);
            gameManager.sendToMap.mockResolvedValue(null);

            await gameManager.callbackUpdate(testGuid, testMapGuid, testData);

            expect(mockIo.emit).toHaveBeenCalledWith(
                GLOBAL_CONFIG.SOCKET.UPDATE_SCENE,
                expect.objectContaining({
                    result: 'ok',
                    data: expect.objectContaining({
                        some: 'data',
                        relief: null
                    })
                })
            );
        });

        test('sendToMap вернул не массив - не вызывает setRelief', async () => {
            mockMediator.get.mockReturnValue(mockUser);
            gameManager.sendToMap.mockResolvedValue({ not: 'an array' });

            await gameManager.callbackUpdate(testGuid, testMapGuid, testData);

            expect(mockEconomyInstance.setRelief).not.toHaveBeenCalled();
        });

        test('экономика не существует - не вызывает setRelief', async () => {
            const newGuid = 'non-existent-guid';
            mockMediator.get.mockReturnValue(mockUser);
            gameManager.sendToMap.mockResolvedValue(mockRelief);

            await gameManager.callbackUpdate(newGuid, testMapGuid, testData);

            expect(mockEconomyInstance.setRelief).not.toHaveBeenCalled();
        });

        test('пользователь не найден - выбрасывает ошибку при обращении к user.socketId', async () => {
            mockMediator.get.mockReturnValue(null);
            gameManager.sendToMap.mockResolvedValue(mockRelief);

            await expect(
                gameManager.callbackUpdate(testGuid, testMapGuid, testData)
            ).rejects.toThrow();
        });
    });

    describe('getResources', () => {
        const mockResources = {
            sources: [
                { x: 1, y: 1, type: 'iron', saturation: 10 },
                { x: 2, y: 3, type: 'fat', saturation: 5 }
            ]
        };
        const mockUser = {
            guid: testGuid,
            socketId: testSocketId
        };

        beforeEach(() => {
            gameManager.economies[testGuid] = mockEconomyInstance;
        });

        test('успешный сценарий: получает ресурсы, обновляет экономику, отправляет клиенту', async () => {
            mockMediator.get.mockReturnValue(mockUser);
            gameManager.sendToMap.mockResolvedValue(mockResources);

            const result = await gameManager.getResources(testGuid, testMapGuid);

            expect(mockMediator.get).toHaveBeenCalledWith(
                gameManager.TRIGGERS.GET_USER_BY_GUID,
                testGuid
            );

            expect(gameManager.sendToMap).toHaveBeenCalledWith(
                GLOBAL_CONFIG.URLS.GET_RESOURSE_VISIBILITY,
                { mapGuid: testMapGuid, userGuid: testGuid }
            );

            expect(mockEconomyInstance.setResources).toHaveBeenCalledWith(mockResources);

            expect(mockIo.to).toHaveBeenCalledWith(testSocketId);
            expect(mockIo.emit).toHaveBeenCalledWith(
                GLOBAL_CONFIG.SOCKET.UPDATE_SCENE,
                expect.objectContaining({
                    result: 'ok',
                    data: { resources: mockResources }
                })
            );

            expect(result).toEqual({ result: 'ok', data: mockResources });
        });

        test('пользователь не найден - возвращает bad(1002)', async () => {
            mockMediator.get.mockReturnValue(null);

            const result = await gameManager.getResources(testGuid, testMapGuid);

            expect(mockAnswer.bad).toHaveBeenCalledWith(1002);
            expect(result).toEqual(mockAnswer.bad(1002));
            expect(gameManager.sendToMap).not.toHaveBeenCalled();
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
            expect(mockIo.emit).toHaveBeenCalledWith(
                GLOBAL_CONFIG.SOCKET.UPDATE_SCENE,
                expect.objectContaining({
                    result: 'ok',
                    data: { resources: null }
                })
            );
        });
    });

    describe('setRelief', () => {
        const mockRelief = [[0, 1, 0], [1, 1, 1]];

        test('существующая экономика - вызывает setRelief', () => {
            gameManager.economies[testGuid] = mockEconomyInstance;

            gameManager.setRelief(testGuid, mockRelief);

            expect(mockEconomyInstance.setRelief).toHaveBeenCalledWith(mockRelief);
        });

        test('экономика не существует - ничего не делает', () => {
            const nonExistentGuid = 'no-economy-here';
            
            expect(() => {
                gameManager.setRelief(nonExistentGuid, mockRelief);
            }).not.toThrow();
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

            expect(gameManager.sendToMushroomsArmy).toHaveBeenCalledWith(
                GLOBAL_CONFIG.URLS.SPAWN_UNIT,
                spawnData
            );
        });
    });

    describe('Интеграционные сценарии', () => {
        test('полный цикл: startGame -> callbackUpdate -> getResources', async () => {
            const mockUser = {
                guid: testGuid,
                socketId: testSocketId
            };
            const mockRelief = [[0, 1], [1, 1]];
            const mockResources = { sources: [{ x: 0, y: 0, type: 'iron', saturation: 10 }] };
            const startData = {
                guids: { mushroomsEconomy: testGuid },
                startPoint: { x: 5, y: 5 },
                mapGuid: testMapGuid
            };

            mockMediator.get.mockReturnValue(mockUser);
            
            gameManager.sendToMap
                .mockResolvedValueOnce(mockRelief)
                .mockResolvedValueOnce(mockResources);

            gameManager.eventStartGame(startData);
            
            const createdEconomy = gameManager.economies[testGuid];
            
            await gameManager.callbackUpdate(testGuid, testMapGuid, {});
            
            await gameManager.getResources(testGuid, testMapGuid);

            expect(createdEconomy).toBeDefined();
            expect(gameManager.sendToMap).toHaveBeenCalledTimes(3);
            expect(mockIo.emit).toHaveBeenCalledTimes(4);
        });
    });
});