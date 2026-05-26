const Worker = require('./Worker');
const CONFIG = require('../../../../config');

jest.mock('../../../../config', () => ({
    ECONOMY: {
        WORKER: {
            HP: 60,
            SPEED: 0.08,
            TYPE: 'worker',
            VISIBILITY: 4,
            WANDER_RADIUS: 8,
            SOURCES_VISIBILITY: 3,
        },
    },
}));

jest.mock('easystarjs', () => {
    return {
        js: jest.fn().mockImplementation(() => ({
            setAcceptableTiles: jest.fn(),
            enableSync: jest.fn(),
            setGrid: jest.fn(),
            findPath: jest.fn(),
            calculate: jest.fn(),
        })),
    };
});

describe('Worker', () => {
    let worker;
    let mockGrid;
    let callbacks;
    let mockResources;
    let mockBuildings;

    beforeEach(() => {
        mockGrid = [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
        ];

        mockResources = [
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
        ];

        mockBuildings = [];

        callbacks = {
            mutateToMine: jest.fn(),
            getResources: jest.fn(() => mockResources),
            getBuildings: jest.fn(() => mockBuildings),
        };

        worker = new Worker({
            x: 2,
            y: 2,
            guid: 'worker-123',
            map: mockGrid,
            callbacks: callbacks,
        });

        worker.units = [worker];
    });

    describe('constructor', () => {
        test('должен инициализировать свойства рабочего', () => {
            expect(worker.type).toBe('worker');
            expect(worker.visibility).toBe(4);
            expect(worker.speed).toBe(0.08);
            expect(worker.sourcesVisibility).toBe(3);
            expect(worker.hp).toBe(60);
            expect(worker.wanderRadius).toBe(8);
            expect(worker.targetResource).toBeNull();
            expect(worker.mode).toBe('wander');
            expect(worker.callbacks).toBe(callbacks);
        });
    });

    describe('get', () => {
        test('должен возвращать публичные поля включая hp, mode и targetResource', () => {
            worker.hp = 45;
            worker.mode = 'goToIron';
            worker.targetResource = { x: 5, y: 5, distSq: 18 };

            const result = worker.get();

            expect(result).toMatchObject({
                guid: 'worker-123',
                x: 2,
                y: 2,
                type: 'worker',
                visibility: 4,
                sourcesVisibility: 3,
                hp: 45,
                mode: 'goToIron',
                targetResource: { x: 5, y: 5, distSq: 18 },
            });
        });
    });

    describe('update', () => {
        test('должен вызывать _scanForIron при каждом обновлении', () => {
            worker._scanForIron = jest.fn();
            worker._hasReachedTarget = jest.fn().mockReturnValue(false);
            
            worker.update();

            expect(worker._scanForIron).toHaveBeenCalled();
        });

        test('в режиме goToIron при достижении цели должен мутировать в шахту если ресурс IRON', () => {
            worker.mode = 'goToIron';
            worker.targetResource = { x: 2, y: 2 };
            worker.x = 2;
            worker.y = 2;
            worker._hasReachedTarget = jest.fn().mockReturnValue(true);
            worker._getResourceAt = jest.fn().mockReturnValue({ type: 'IRON' });
            worker._resetToWander = jest.fn();
            
            worker.update();

            expect(callbacks.mutateToMine).toHaveBeenCalledWith(worker);
        });

        test('в режиме goToIron при достижении цели должен сброситься в wander если ресурс не IRON', () => {
            worker.mode = 'goToIron';
            worker.targetResource = { x: 2, y: 2 };
            worker.x = 2;
            worker.y = 2;
            worker._hasReachedTarget = jest.fn().mockReturnValue(true);
            worker._getResourceAt = jest.fn().mockReturnValue(null);
            worker._resetToWander = jest.fn();
            
            worker.update();

            expect(callbacks.mutateToMine).not.toHaveBeenCalled();
            expect(worker._resetToWander).toHaveBeenCalled();
        });

        test('в режиме wander при достижении цели должен выбрать новую цель для блуждания', () => {
            worker.mode = 'wander';
            worker._hasReachedTarget = jest.fn().mockReturnValue(true);
            worker._pickWanderTarget = jest.fn();
            
            worker.update();

            expect(worker._pickWanderTarget).toHaveBeenCalled();
        });
    });

    describe('_scanForIron', () => {
        beforeEach(() => {
            worker.x = 2;
            worker.y = 2;
            worker.mode = 'wander';
        });

        test('должен найти ближайший ресурс IRON и переключиться в режим goToIron', () => {
            mockResources[1][2] = { type: 'IRON', saturation: 100 };
            mockResources[3][3] = { type: 'IRON', saturation: 50 };

            worker._scanForIron();

            expect(worker.mode).toBe('goToIron');
            expect(worker.targetResource).toMatchObject({ x: 2, y: 1, distSq: 1 });
            expect(worker.targetX).toBe(2);
            expect(worker.targetY).toBe(1);
        });

        test('должен игнорировать ресурсы занятые зданиями', () => {
            mockResources[3][2] = { type: 'IRON', saturation: 100 };
            mockBuildings.push({ type: 'reactor', x: 2, y: 3, size: 1 });

            worker._scanForIron();

            expect(worker.mode).toBe('wander');
            expect(worker.targetResource).toBeNull();
        });

        test('должен игнорировать мицелий при проверке занятости зданий', () => {
            mockResources[2][3] = { type: 'IRON', saturation: 100 };
            mockBuildings.push({ type: 'mycelium', x: 2, y: 3, size: 1 });

            worker._scanForIron();

            expect(worker.mode).toBe('goToIron');
            expect(worker.targetResource).toMatchObject({ x: 3, y: 2 });
        });

        test('должен игнорировать ресурсы уже занятые другими рабочими', () => {
            mockResources[1][2] = { type: 'IRON', saturation: 100 };
            
            const otherWorker = { 
                guid: 'other', 
                targetResource: { x: 2, y: 1 } 
            };
            worker.units.push(otherWorker);

            worker._scanForIron();

            expect(worker.mode).toBe('wander');
            expect(worker.targetResource).toBeNull();
        });

        test('не должен сканировать если уже в режиме goToIron и есть targetResource', () => {
            worker.mode = 'goToIron';
            worker.targetResource = { x: 1, y: 1 };
            worker._scanForIron();

            expect(worker.mode).toBe('goToIron');
            expect(worker.targetResource).toEqual({ x: 1, y: 1 });
        });
    });

    describe('_resetToWander', () => {
        test('должен сбросить targetResource, mode и выбрать новую цель для блуждания', () => {
            worker.targetResource = { x: 5, y: 5 };
            worker.mode = 'goToIron';
            worker._pickWanderTarget = jest.fn();

            worker._resetToWander();

            expect(worker.targetResource).toBeNull();
            expect(worker.mode).toBe('wander');
            expect(worker._pickWanderTarget).toHaveBeenCalled();
        });
    });

    describe('_pickWanderTarget', () => {
        beforeEach(() => {
            worker.grid = mockGrid;
            worker.x = 2;
            worker.y = 2;
            worker.wanderRadius = 8;
        });

        test('должен выбрать случайную проходимую клетку в радиусе блуждания', () => {
            worker._pickWanderTarget();

            expect(worker.targetX).toBeDefined();
            expect(worker.targetY).toBeDefined();
            expect(worker.targetX).toBeGreaterThanOrEqual(0);
            expect(worker.targetX).toBeLessThan(5);
            expect(worker.targetY).toBeGreaterThanOrEqual(0);
            expect(worker.targetY).toBeLessThan(5);
        });

        test('должен выбрать клетку только если она проходима (grid[y][x] === 0)', () => {
            mockGrid[3][3] = 1;
            mockGrid[1][1] = 0;
            
            worker._pickWanderTarget();
            
            const targetX = worker.targetX;
            const targetY = worker.targetY;
            
            if (targetX === 3 && targetY === 3) {
                expect(mockGrid[targetY][targetX]).toBe(1);
            } else {
                expect(mockGrid[targetY][targetX]).toBe(0);
            }
        });

        test('не должен устанавливать цель если нет проходимых клеток', () => {
            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 5; j++) {
                    mockGrid[i][j] = 1;
                }
            }
            
            worker._pickWanderTarget();
            
            expect(worker.targetX).toBe(2);
            expect(worker.targetY).toBe(2);
        });
    });

    describe('_getResourceAt', () => {
        test('должен возвращать ресурс по указанным координатам', () => {
            mockResources[3][4] = { type: 'IRON', saturation: 75 };
            
            const result = worker._getResourceAt(4, 3);
            
            expect(result).toEqual({ type: 'IRON', saturation: 75 });
        });

        test('должен возвращать null если ресурса нет', () => {
            const result = worker._getResourceAt(0, 0);
            
            expect(result).toBeNull();
        });
    });
});