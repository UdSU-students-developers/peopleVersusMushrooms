const { buildPathGrid, buildingFootprintSize } = require('./pathGrid');

describe('pathGrid', () => {
    const emptyMap = () => Array.from({ length: 6 }, () => Array(6).fill(0));

    test('buildingFootprintSize берёт size с карты', () => {
        expect(buildingFootprintSize({ type: 'barracks', size: 2 })).toBe(2);
    });

    test('buildingFootprintSize по type из справочника peopleEconomy', () => {
        expect(buildingFootprintSize({ type: 'LARGE_REACTOR' })).toBe(2);
        expect(buildingFootprintSize({ type: 'driller' })).toBe(1);
    });

    test('barracks 2×2 блокирует клетки от верхнего левого угла', () => {
        const grid = buildPathGrid(emptyMap(), [
            { x: 2, y: 2, type: 'barracks', size: 2 },
        ]);
        expect(grid[2][2]).toBe(1);
        expect(grid[2][3]).toBe(1);
        expect(grid[3][2]).toBe(1);
        expect(grid[3][3]).toBe(1);
        expect(grid[1][2]).toBe(0);
    });
});
