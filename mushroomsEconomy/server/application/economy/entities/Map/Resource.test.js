const Resource = require('./Resource');
const GLOBAL_CONFIG = require('../../../../../../global/globalConfig');

jest.mock('../../../../../../global/globalConfig', () => ({}));

describe('Resource', () => {
    describe('constructor', () => {
        test('должен сохранять x, y, type, saturation', () => {
            const resource = new Resource(5, 10, 'IRON', 75);
            
            expect(resource.x).toBe(5);
            expect(resource.y).toBe(10);
            expect(resource.type).toBe('IRON');
            expect(resource.saturation).toBe(75);
        });

        test('должен работать с нулевыми значениями', () => {
            const resource = new Resource(0, 0, '', 0);
            
            expect(resource.x).toBe(0);
            expect(resource.y).toBe(0);
            expect(resource.type).toBe('');
            expect(resource.saturation).toBe(0);
        });

        test('должен работать с отрицательными координатами', () => {
            const resource = new Resource(-5, -3, 'GOLD', 100);
            
            expect(resource.x).toBe(-5);
            expect(resource.y).toBe(-3);
        });
    });

    describe('get', () => {
        test('должен возвращать объект с полями x, y, type, saturation', () => {
            const resource = new Resource(3, 7, 'IRON', 50);
            const result = resource.get();
            
            expect(result).toEqual({
                x: 3,
                y: 7,
                type: 'IRON',
                saturation: 50,
            });
        });

        test('должен возвращать новый объект, а не ссылку на поля', () => {
            const resource = new Resource(1, 2, 'COPPER', 30);
            const result = resource.get();
            
            result.x = 999;
            
            expect(resource.x).toBe(1);
            expect(result.x).toBe(999);
        });

        test('должен корректно сериализоваться в JSON', () => {
            const resource = new Resource(8, 4, 'IRON', 80);
            const json = JSON.stringify(resource.get());
            const parsed = JSON.parse(json);
            
            expect(parsed).toEqual({
                x: 8,
                y: 4,
                type: 'IRON',
                saturation: 80,
            });
        });
    });
});