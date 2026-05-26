const Unit = require('./Unit');

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

describe('Unit', () => {
    let unit;
    let mockGrid;

    beforeEach(() => {
        mockGrid = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ];

        unit = new Unit({
            x: 1,
            y: 1,
            guid: 'unit-123',
            map: mockGrid,
            type: 'worker',
            visibility: 3,
            speed: 0.5,
            sourcesVisibility: 5,
        });
    });

    describe('constructor', () => {
        test('должен инициализировать базовые свойства', () => {
            expect(unit.guid).toBe('unit-123');
            expect(unit.type).toBe('worker');
            expect(unit.visibility).toBe(3);
            expect(unit.sourcesVisibility).toBe(5);
            expect(unit.x).toBe(1);
            expect(unit.y).toBe(1);
            expect(unit.targetX).toBe(1);
            expect(unit.targetY).toBe(1);
            expect(unit.hp).toBe(1);
            expect(unit.speed).toBe(0.5);
            expect(unit.momentum).toBe(0);
            expect(unit.path).toEqual([]);
            expect(unit.units).toEqual([]);
        });

        test('должен создавать экземпляр EasyStar', () => {
            const EasyStar = require('easystarjs');
            expect(EasyStar.js).toHaveBeenCalled();
            expect(unit.easyStar.setAcceptableTiles).toHaveBeenCalledWith([0]);
            expect(unit.easyStar.enableSync).toHaveBeenCalled();
            expect(unit.easyStar.setGrid).toHaveBeenCalledWith(mockGrid);
        });

        test('должен работать без переданной карты', () => {
            const unitWithoutMap = new Unit({
                x: 0,
                y: 0,
                guid: 'unit-456',
                type: 'larva',
                visibility: 2,
            });

            expect(unitWithoutMap.grid).toBeNull();
        });
    });

    describe('get', () => {
        test('должен возвращать публичные поля', () => {
            const result = unit.get();

            expect(result).toEqual({
                guid: 'unit-123',
                x: 1,
                y: 1,
                type: 'worker',
                visibility: 3,
                sourcesVisibility: 5,
            });
        });

        test('не должен возвращать внутренние поля', () => {
            const result = unit.get();

            expect(result).not.toHaveProperty('hp');
            expect(result).not.toHaveProperty('speed');
            expect(result).not.toHaveProperty('path');
            expect(result).not.toHaveProperty('momentum');
            expect(result).not.toHaveProperty('targetX');
            expect(result).not.toHaveProperty('targetY');
        });
    });

    describe('setTarget', () => {
        test('должен устанавливать целевую точку и пересчитывать путь', () => {
            const recalculateSpy = jest.spyOn(unit, '_recalculatePath');

            unit.setTarget(2, 2);

            expect(unit.targetX).toBe(2);
            expect(unit.targetY).toBe(2);
            expect(recalculateSpy).toHaveBeenCalled();
        });
    });

    describe('setGrid', () => {
        test('должен обновлять сетку и передавать её в EasyStar', () => {
            const newGrid = [[0, 0], [0, 0]];
            
            unit.setGrid(newGrid);

            expect(unit.grid).toBe(newGrid);
            expect(unit.easyStar.setGrid).toHaveBeenCalledWith(newGrid);
        });
    });

    describe('takeDamage', () => {
        test('должен уменьшать hp на указанную величину', () => {
            unit.hp = 100;
            const isDead = unit.takeDamage(30);

            expect(unit.hp).toBe(70);
            expect(isDead).toBe(false);
        });

        test('должен вернуть true если hp становится 0', () => {
            unit.hp = 50;
            const isDead = unit.takeDamage(50);

            expect(unit.hp).toBe(0);
            expect(isDead).toBe(true);
        });

        test('не должен уменьшать hp ниже 0', () => {
            unit.hp = 20;
            unit.takeDamage(100);

            expect(unit.hp).toBe(0);
        });

        test('не должен ничего делать если amount <= 0', () => {
            unit.hp = 100;
            unit.takeDamage(0);
            unit.takeDamage(-10);

            expect(unit.hp).toBe(100);
        });
    });

    describe('findNearestCell', () => {
        beforeEach(() => {
            unit.grid = [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0],
            ];
            unit.x = 1;
            unit.y = 1;
            unit.visibility = { buildings: [] };
        });

        test('должен возвращать все соседние клетки по 4 направлениям', () => {
            const cells = unit.findNearestCell();
            
            expect(cells).toHaveLength(4);
            expect(cells).toContainEqual({ x: 1, y: 0 });
            expect(cells).toContainEqual({ x: 1, y: 2 });
            expect(cells).toContainEqual({ x: 0, y: 1 });
            expect(cells).toContainEqual({ x: 2, y: 1 });
        });

        test('не должен возвращать клетки занятые зданиями', () => {
            unit.visibility.buildings = [
                { x: 1, y: 0 },
                { x: 2, y: 1 },
            ];

            const cells = unit.findNearestCell();
            
            expect(cells).toHaveLength(2);
            expect(cells).toContainEqual({ x: 1, y: 2 });
            expect(cells).toContainEqual({ x: 0, y: 1 });
        });

        test('не должен возвращать клетки за границами карты', () => {
            unit.x = 0;
            unit.y = 0;
            unit.grid = [
                [0, 0],
                [0, 0],
            ];

            const cells = unit.findNearestCell();
            
            expect(cells).toHaveLength(2);
            expect(cells).toContainEqual({ x: 0, y: 1 });
            expect(cells).toContainEqual({ x: 1, y: 0 });
        });
    });

    describe('update', () => {
        test('не должен двигаться если цель достигнута', () => {
            unit.x = 2;
            unit.y = 2;
            unit.targetX = 2;
            unit.targetY = 2;
            unit.path = [{ x: 3, y: 3 }];
            unit.momentum = 0.9;
            unit.speed = 0.5;
            unit._tryStep = jest.fn();

            unit.update();

            expect(unit._tryStep).not.toHaveBeenCalled();
        });

        test('должен накапливать momentum и делать шаг при достижении 1.0', () => {
            unit.targetX = 2;
            unit.targetY = 2;
            unit.path = [{ x: 2, y: 2 }];
            unit.momentum = 0.6;
            unit.speed = 0.4;
            unit._isCellWalkable = jest.fn().mockReturnValue(true);
            unit._tryStep = jest.fn();

            unit.update();

            expect(unit.momentum).toBe(0);
            expect(unit._tryStep).toHaveBeenCalled();
        });

        test('не должен делать шаг если momentum < 1.0', () => {
            unit.targetX = 2;
            unit.targetY = 2;
            unit.momentum = 0.3;
            unit.speed = 0.4;
            unit._tryStep = jest.fn();

            unit.update();

            expect(unit.momentum).toBe(0.7);
            expect(unit._tryStep).not.toHaveBeenCalled();
        });
    });

    describe('_hasReachedTarget', () => {
        test('должен вернуть true если позиция совпадает с целью', () => {
            unit.x = 5;
            unit.y = 5;
            unit.targetX = 5;
            unit.targetY = 5;

            expect(unit._hasReachedTarget()).toBe(true);
        });

        test('должен вернуть false если позиция не совпадает с целью', () => {
            unit.x = 5;
            unit.y = 5;
            unit.targetX = 6;
            unit.targetY = 5;

            expect(unit._hasReachedTarget()).toBe(false);
        });
    });

    describe('_tryStep', () => {
        beforeEach(() => {
            unit.x = 1;
            unit.y = 1;
            unit.path = [{ x: 1, y: 2 }, { x: 1, y: 3 }];
            unit._isCellWalkable = jest.fn().mockReturnValue(true);
        });

        test('должен переместиться на следующую клетку пути', () => {
            unit._tryStep();

            expect(unit.x).toBe(1);
            expect(unit.y).toBe(2);
            expect(unit.path).toEqual([{ x: 1, y: 3 }]);
        });

        test('не должен перемещаться если путь пуст', () => {
            unit.path = [];

            unit._tryStep();

            expect(unit.x).toBe(1);
            expect(unit.y).toBe(1);
        });

        test('должен пересчитать путь если следующая клетка не проходима', () => {
            unit._isCellWalkable.mockReturnValue(false);
            unit._recalculatePath = jest.fn();

            unit._tryStep();

            expect(unit.x).toBe(1);
            expect(unit.y).toBe(1);
            expect(unit._recalculatePath).toHaveBeenCalled();
        });
    });

    describe('_recalculatePath', () => {
        beforeEach(() => {
            unit.x = 0;
            unit.y = 0;
            unit.targetX = 2;
            unit.targetY = 2;
            unit.grid = mockGrid;
        });

        test('должен найти путь от текущей позиции до цели', () => {
            unit.easyStar.findPath.mockImplementation((x1, y1, x2, y2, callback) => {
                callback([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }]);
            });

            unit._recalculatePath();

            expect(unit.easyStar.findPath).toHaveBeenCalledWith(0, 0, 2, 2, expect.any(Function));
            expect(unit.path).toEqual([{ x: 1, y: 1 }, { x: 2, y: 2 }]);
        });

        test('не должен пересчитывать путь если нет грида', () => {
            unit.grid = null;
            unit._recalculatePath();

            expect(unit.easyStar.findPath).not.toHaveBeenCalled();
        });

        test('не должен пересчитывать путь если цель уже достигнута', () => {
            unit.x = 2;
            unit.y = 2;
            unit.targetX = 2;
            unit.targetY = 2;

            unit._recalculatePath();

            expect(unit.easyStar.findPath).not.toHaveBeenCalled();
        });

        test('должен очищать путь если путь не найден', () => {
            unit.path = [{ x: 1, y: 1 }];
            
            unit.easyStar.findPath.mockImplementation((x1, y1, x2, y2, callback) => {
                callback(null);
            });

            unit._recalculatePath();

            expect(unit.path).toEqual([]);
        });
    });

    describe('setUnits', () => {
        test('должен сохранять массив юнитов', () => {
            const units = [{ guid: 'unit-1' }, { guid: 'unit-2' }];
            
            unit.setUnits(units);

            expect(unit.units).toBe(units);
        });
    });

    describe('_isCellWalkable', () => {
        beforeEach(() => {
            unit.grid = [
                [0, 1, 0],
                [0, 0, 0],
                [0, 0, 0],
            ];
            unit.units = [];
        });

        test('должен вернуть true для пустой проходимой клетки', () => {
            const result = unit._isCellWalkable(0, 0);
            expect(result).toBe(true);
        });

        test('должен вернуть false для непроходимой клетки (рельеф 1)', () => {
            const result = unit._isCellWalkable(1, 0);
            expect(result).toBe(false);
        });

        test('должен вернуть false если клетка занята другим юнитом', () => {
            unit.units = [{ guid: 'other', x: 0, y: 0 }];
            
            const result = unit._isCellWalkable(0, 0);
            expect(result).toBe(false);
        });

        test('должен разрешать проход если клетка занята этим же юнитом', () => {
            unit.units = [{ guid: 'unit-123', x: 0, y: 0 }];
            
            const result = unit._isCellWalkable(0, 0);
            expect(result).toBe(true);
        });

        test('должен вернуть false если координаты за пределами грида', () => {
            const result = unit._isCellWalkable(10, 10);
            expect(result).toBe(false);
        });
    });
});