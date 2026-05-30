const Larva = require('./Larva');
const CONFIG = require('../../../../config');

jest.mock('../../../../config', () => ({
    ECONOMY: {
        LARVA: {
            HP: 40,
            SPEED: 0.05,
            WANDER_RADIUS: 8,
            TYPE: 'larva',
            VISIBILITY: 2,
            SOURCES_VISIBILITY: 100,
            GROWTH_LIMIT: 100,
            MUTATION_ENERGY_COST: 15,
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

describe('Larva', () => {
    let larva;
    let mockGrid;
    let callbacks;

    beforeEach(() => {
        mockGrid = [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
        ];

        callbacks = {
            mutateToWorker: jest.fn(),
        };

        larva = new Larva({
            x: 2,
            y: 2,
            guid: 'larva-123',
            map: mockGrid,
            homeX: 2,
            homeY: 2,
            callbacks: callbacks,
        });
    });

    describe('constructor', () => {
        test('должен инициализировать свойства личинки', () => {
            expect(larva.type).toBe('larva');
            expect(larva.visibility).toBe(2);
            expect(larva.speed).toBe(0.05);
            expect(larva.sourcesVisibility).toBe(100);
            expect(larva.hp).toBe(40);
            expect(larva.homeX).toBe(2);
            expect(larva.homeY).toBe(2);
            expect(larva.growthScale).toBe(0);
            expect(larva.wanderRadius).toBe(8);
            expect(larva.callbacks).toBe(callbacks);
        });

        test('должен использовать текущую позицию как домашнюю если homeX/homeY не переданы', () => {
            const larvaWithoutHome = new Larva({
                x: 5,
                y: 5,
                guid: 'larva-456',
                map: mockGrid,
            });

            expect(larvaWithoutHome.homeX).toBe(5);
            expect(larvaWithoutHome.homeY).toBe(5);
        });
    });

    describe('get', () => {
        test('должен возвращать публичные поля включая hp и growthScale', () => {
            larva.growthScale = 45;
            larva.hp = 30;

            const result = larva.get();

            expect(result).toMatchObject({
                guid: 'larva-123',
                x: 2,
                y: 2,
                type: 'larva',
                visibility: 2,
                sourcesVisibility: 100,
                hp: 30,
                growthScale: 45,
            });
        });
    });

    describe('update', () => {
        test('должен увеличивать growthScale каждый тик пока не достигнет GROWTH_LIMIT', () => {
            larva.growthScale = 50;
            larva._hasReachedTarget = jest.fn().mockReturnValue(true);
            larva._wanderAroundHome = jest.fn();
            larva._hasReachedTarget = jest.fn().mockReturnValue(true);
            
            larva.update();

            expect(larva.growthScale).toBe(51);
        });

        test('должен вызвать mutateToWorker когда growthScale достигает GROWTH_LIMIT', () => {
            larva.growthScale = 99;
            
            larva.update();

            expect(larva.growthScale).toBe(100);
            expect(callbacks.mutateToWorker).toHaveBeenCalledWith(larva);
        });

        test('не должен вызывать mutateToWorker если growthScale ещё не достиг лимита', () => {
            larva.growthScale = 50;
            larva._hasReachedTarget = jest.fn().mockReturnValue(true);
            larva._wanderAroundHome = jest.fn();
            
            larva.update();

            expect(callbacks.mutateToWorker).not.toHaveBeenCalled();
        });

        test('должен вызывать _wanderAroundHome если цель достигнута', () => {
            larva.growthScale = 50;
            larva._hasReachedTarget = jest.fn().mockReturnValue(true);
            larva._wanderAroundHome = jest.fn();
            
            larva.update();

            expect(larva._wanderAroundHome).toHaveBeenCalled();
        });

        test('не должен вызывать _wanderAroundHome если цель не достигнута', () => {
            larva.growthScale = 50;
            larva._hasReachedTarget = jest.fn().mockReturnValue(false);
            larva._wanderAroundHome = jest.fn();
            larva.update = jest.fn();
            
            const superUpdateSpy = jest.spyOn(larva, 'update');
            superUpdateSpy.mockImplementation(() => {});
            
            larva.update();

            expect(larva._wanderAroundHome).not.toHaveBeenCalled();
        });
    });

    describe('_wanderAroundHome', () => {
        test('должен выбрать случайную проходимую клетку в радиусе блуждания', () => {
            larva._pickRandomWalkableCell = jest.fn().mockReturnValue({ x: 3, y: 4 });
            larva.setTarget = jest.fn();

            larva._wanderAroundHome();

            expect(larva._pickRandomWalkableCell).toHaveBeenCalled();
            expect(larva.setTarget).toHaveBeenCalledWith(3, 4);
        });

        test('не должен устанавливать цель если нет проходимых клеток', () => {
            larva._pickRandomWalkableCell = jest.fn().mockReturnValue(null);
            larva.setTarget = jest.fn();

            larva._wanderAroundHome();

            expect(larva.setTarget).not.toHaveBeenCalled();
        });
    });

    describe('_pickRandomWalkableCell', () => {
        beforeEach(() => {
            larva.grid = mockGrid;
            larva.homeX = 2;
            larva.homeY = 2;
            larva.wanderRadius = 8;
        });

        test('должен вернуть координаты проходимой клетки в радиусе блуждания', () => {
            const result = larva._pickRandomWalkableCell();

            expect(result).toBeDefined();
            expect(result.x).toBeGreaterThanOrEqual(0);
            expect(result.x).toBeLessThan(5);
            expect(result.y).toBeGreaterThanOrEqual(0);
            expect(result.y).toBeLessThan(5);
        });

        test('должен вернуть null если после 10 попыток не найдена проходимая клетка', () => {
            larva.grid = [
                [1, 1, 1],
                [1, 1, 1],
                [1, 1, 1],
            ];
            larva.homeX = 1;
            larva.homeY = 1;

            const result = larva._pickRandomWalkableCell();

            expect(result).toBeNull();
        });

        test('должен проверять что клетка находится в пределах карты', () => {
            larva.homeX = 0;
            larva.homeY = 0;
            larva.wanderRadius = 10;

            for (let i = 0; i < 20; i++) {
                const result = larva._pickRandomWalkableCell();
                if (result) {
                    expect(result.x).toBeGreaterThanOrEqual(0);
                    expect(result.x).toBeLessThan(5);
                    expect(result.y).toBeGreaterThanOrEqual(0);
                    expect(result.y).toBeLessThan(5);
                }
            }
        });

        test('должен проверять что клетка проходима (grid[y][x] === 0)', () => {
            larva.grid[3][3] = 1;
            larva.grid[3][4] = 0;
            
            let foundWalkable = false;
            for (let i = 0; i < 20; i++) {
                const result = larva._pickRandomWalkableCell();
                if (result && result.x === 3 && result.y === 4) {
                    foundWalkable = true;
                    break;
                }
            }
            
            expect(foundWalkable).toBe(true);
        });
    });
});