const Map = require('./Map');
const Resource = require('./Resource');
const GLOBAL_CONFIG = require('../../../../../../global/globalConfig');

jest.mock('../../../../../../global/globalConfig', () => ({
    MAP_SIZE: 10,
}));

describe('Map', () => {
    let map;

    beforeEach(() => {
        map = new Map();
    });

    describe('constructor', () => {
        test('должен инициализировать пустые карты ресурсов и рельефа размером MAP_SIZE x MAP_SIZE', () => {
            expect(map.resources).toHaveLength(10);
            expect(map.resources[0]).toHaveLength(10);
            expect(map.resources[9]).toHaveLength(10);
            expect(map.resources[0][0]).toBeNull();

            expect(map.relief).toHaveLength(10);
            expect(map.relief[0]).toHaveLength(10);
            expect(map.relief[0][0]).toBeNull();
        });

        test('должен инициализировать myceliumGrid и larvaGrid как null', () => {
            expect(map.myceliumGrid).toBeNull();
            expect(map.larvaGrid).toBeNull();
        });
    });

    describe('get', () => {
        test('должен возвращать объект с ресурсами и рельефом', () => {
            const result = map.get();
            expect(result).toHaveProperty('resources');
            expect(result).toHaveProperty('relief');
            expect(result.resources).toBe(map.resources);
            expect(result.relief).toBe(map.relief);
        });
    });

    describe('setResources', () => {
        test('должен добавлять новые ресурсы на карту', () => {
            const resources = [
                { x: 0, y: 0, type: 'IRON', saturation: 100 },
                { x: 5, y: 3, type: 'IRON', saturation: 50 },
            ];

            map.setResources(resources);

            expect(map.resources[0][0]).toBeInstanceOf(Resource);
            expect(map.resources[0][0].get()).toMatchObject({
                x: 0, y: 0, type: 'IRON', saturation: 100,
            });

            expect(map.resources[3][5]).toBeInstanceOf(Resource);
            expect(map.resources[3][5].get()).toMatchObject({
                x: 5, y: 3, type: 'IRON', saturation: 50,
            });
        });

        test('не должен перезаписывать существующий ресурс', () => {
            const firstResource = [{ x: 0, y: 0, type: 'IRON', saturation: 100 }];
            const secondResource = [{ x: 0, y: 0, type: 'GOLD', saturation: 200 }];

            map.setResources(firstResource);
            map.setResources(secondResource);

            expect(map.resources[0][0].get().type).toBe('IRON');
            expect(map.resources[0][0].get().saturation).toBe(100);
        });

        test('должен игнорировать ресурсы с null-значениями', () => {
            const resources = [{ x: 0, y: 0, type: 'IRON', saturation: 100 }];
            
            map.resources[0][0] = { some: 'existing' };
            map.setResources(resources);

            expect(map.resources[0][0]).toEqual({ some: 'existing' });
        });
    });

    describe('setRelief', () => {
        test('должен устанавливать рельеф карты', () => {
            const relief = [
                [0, 1, 0],
                [1, 0, 1],
                [0, 1, 0],
            ];

            map.setRelief(relief);
            expect(map.relief).toBe(relief);
        });
    });

    describe('updateLarvaGrid', () => {
        beforeEach(() => {
            map.relief = Array(10).fill().map(() => Array(10).fill(0));
        });

        test('должен инициализировать larvaGrid единицами если его не было', () => {
            const buildings = { mycelium: [], reactors: [], incubators: [] };
            
            map.updateLarvaGrid(buildings);
            
            expect(map.larvaGrid).toHaveLength(10);
            expect(map.larvaGrid[0]).toHaveLength(10);
            expect(map.larvaGrid[0][0]).toBe(1);
            expect(map.larvaGrid[5][5]).toBe(1);
        });

        test('должен устанавливать 0 на позициях грибниц', () => {
            const buildings = {
                mycelium: [
                    { x: 2, y: 3 },
                    { x: 7, y: 1 },
                ],
                reactors: [],
                incubators: [],
            };
            
            map.updateLarvaGrid(buildings);
            
            expect(map.larvaGrid[3][2]).toBe(0);
            expect(map.larvaGrid[1][7]).toBe(0);
            expect(map.larvaGrid[0][0]).toBe(1);
        });

        test('должен устанавливать 1 на позициях зданий (реакторы и инкубаторы)', () => {
            const buildings = {
                mycelium: [],
                reactors: [
                    { x: 1, y: 1, size: 2 },
                ],
                incubators: [
                    { x: 5, y: 5, size: 1 },
                ],
            };
            
            map.updateLarvaGrid(buildings);
            
            expect(map.larvaGrid[1][1]).toBe(1);
            expect(map.larvaGrid[1][2]).toBe(1);
            expect(map.larvaGrid[2][1]).toBe(1);
            expect(map.larvaGrid[2][2]).toBe(1);
            expect(map.larvaGrid[5][5]).toBe(1);
        });

        test('должен корректно обрабатывать здания без указания size (size по умолчанию 1)', () => {
            const buildings = {
                mycelium: [],
                reactors: [
                    { x: 3, y: 3 },
                ],
                incubators: [],
            };
            
            map.updateLarvaGrid(buildings);
            
            expect(map.larvaGrid[3][3]).toBe(1);
        });

        test('не должен выходить за границы карты при установке зданий', () => {
            const buildings = {
                mycelium: [],
                reactors: [
                    { x: 9, y: 9, size: 2 },
                ],
                incubators: [],
            };
            
            expect(() => map.updateLarvaGrid(buildings)).not.toThrow();
            expect(map.larvaGrid[9][9]).toBeDefined();
        });

        test('должен игнорировать обновление если relief не инициализирован', () => {
            map.relief = null;
            const buildings = { mycelium: [{ x: 0, y: 0 }], reactors: [], incubators: [] };
            
            map.updateLarvaGrid(buildings);
            
            expect(map.larvaGrid).toBeNull();
        });

        test('должен перезаполнять существующий larvaGrid единицами перед установкой', () => {
            const firstBuildings = {
                mycelium: [{ x: 1, y: 1 }],
                reactors: [],
                incubators: [],
            };
            
            map.updateLarvaGrid(firstBuildings);
            expect(map.larvaGrid[1][1]).toBe(0);
            
            const secondBuildings = {
                mycelium: [{ x: 2, y: 2 }],
                reactors: [],
                incubators: [],
            };
            
            map.updateLarvaGrid(secondBuildings);
            
            expect(map.larvaGrid[1][1]).toBe(1);
            expect(map.larvaGrid[2][2]).toBe(0);
        });
    });

    describe('updateMyceliumGrid', () => {
        test('должен инициализировать myceliumGrid нулями если его не было', () => {
            map.updateMyceliumGrid([]);
            
            expect(map.myceliumGrid).toHaveLength(10);
            expect(map.myceliumGrid[0]).toHaveLength(10);
            expect(map.myceliumGrid[0][0]).toBe(0);
            expect(map.myceliumGrid[5][5]).toBe(0);
        });

        test('должен устанавливать 1 на позициях грибниц', () => {
            const myceliumList = [
                { x: 1, y: 2 },
                { x: 8, y: 5 },
                { x: 0, y: 0 },
            ];
            
            map.updateMyceliumGrid(myceliumList);
            
            expect(map.myceliumGrid[2][1]).toBe(1);
            expect(map.myceliumGrid[5][8]).toBe(1);
            expect(map.myceliumGrid[0][0]).toBe(1);
        });

        test('не должен выходить за границы карты', () => {
            const myceliumList = [
                { x: -1, y: 0 },
                { x: 10, y: 10 },
                { x: 5, y: 3 },
            ];
            
            map.updateMyceliumGrid(myceliumList);
            
            expect(map.myceliumGrid[0][-1]).toBeUndefined();
            expect(map.myceliumGrid[10]?.[10]).toBeUndefined();
            expect(map.myceliumGrid[3][5]).toBe(1);
        });

        test('должен перезаполнять существующий myceliumGrid нулями', () => {
            const firstList = [{ x: 1, y: 1 }];
            map.updateMyceliumGrid(firstList);
            expect(map.myceliumGrid[1][1]).toBe(1);
            
            const secondList = [{ x: 2, y: 2 }];
            map.updateMyceliumGrid(secondList);
            
            expect(map.myceliumGrid[1][1]).toBe(0);
            expect(map.myceliumGrid[2][2]).toBe(1);
        });
    });

    describe('_initEmptyMap', () => {
        test('должен создавать пустую квадратную карту размером MAP_SIZE', () => {
            const emptyMap = map._initEmptyMap();
            
            expect(emptyMap).toHaveLength(10);
            expect(emptyMap[0]).toHaveLength(10);
            expect(emptyMap[5][5]).toBeNull();
            expect(emptyMap[9][9]).toBeNull();
        });

        test('должен создавать карту с null во всех ячейках', () => {
            const emptyMap = map._initEmptyMap();
            
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    expect(emptyMap[i][j]).toBeNull();
                }
            }
        });
    });
});