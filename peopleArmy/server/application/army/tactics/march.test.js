const Army = require('../Army');
const { MARCH_OBJECTIVE } = require('./constants');

function makeArmy() {
    const army = new Army({
        guids: { mushroomsArmy: 'a', mushroomsEconomy: 'e' },
        guid: 'p',
        common: { guid: () => 'g' },
        callbacks: { update: jest.fn(), takeDamage: jest.fn() },
        map: Array.from({ length: 100 }, () => Array(100).fill(0)),
    });
    return army;
}

describe('march to mushroom objective', () => {
    test('без врагов moveGoal — марш к зоне грибов', () => {
        const army = makeArmy();
        const unit = {
            guid: 'u1',
            type: 'soldier',
            x: 10,
            y: 10,
            hp: 20,
            range: 3,
            damage: 5,
            isDead: () => false,
        };
        army.units = [unit];
        army.enemyUnits = [];
        army.enemyBuildings = [];

        army.tactics.plan();

        expect(unit.moveGoal).toBeDefined();
        expect(unit.moveGoal.reason).toBe('march');
        const dist = Math.hypot(unit.moveGoal.x - MARCH_OBJECTIVE.x, unit.moveGoal.y - MARCH_OBJECTIVE.y);
        expect(dist).toBeLessThan(3);

        army.destructor();
    });
});
