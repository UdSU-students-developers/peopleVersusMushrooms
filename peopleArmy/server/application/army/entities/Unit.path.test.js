const Unit = require('./Unit');

describe('Unit pathfinding — здания peopleEconomy', () => {
    const map = () => Array.from({ length: 8 }, () => Array(8).fill(0));

    test('обходит barracks 2×2, поставленный на старом маршруте', () => {
        const unit = new Unit({ guid: 'u1', x: 0, y: 0 });
        unit.speed = 10;
        unit.setTarget(4, 0);

        const noBuildings = [];
        unit.calculateUnitPath(map(), noBuildings);
        expect(unit.path.length).toBeGreaterThan(0);
        expect(unit.path[0]).toEqual({ x: 1, y: 0 });

        const withBarracks = [{ x: 1, y: 0, type: 'barracks', size: 2 }];
        unit.calculateUnitPath(map(), withBarracks);

        const blocked = new Set(['1,0', '2,0', '1,1', '2,1']);
        expect(unit.path.length).toBeGreaterThan(0);
        for (const step of unit.path) {
            expect(blocked.has(`${step.x},${step.y}`)).toBe(false);
        }
    });
});
