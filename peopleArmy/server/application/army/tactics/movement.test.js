const Army = require('../Army');
const Unit = require('../entities/Unit');

function makeArmy() {
    return new Army({
        guids: { mushroomsArmy: 'a', mushroomsEconomy: 'e' },
        guid: 'p',
        common: { guid: () => 'g' },
        callbacks: { update: jest.fn(), takeDamage: jest.fn() },
        map: Array.from({ length: 20 }, () => Array(20).fill(0)),
    });
}

describe('movement after lost target', () => {
    test('после пропажи цели юнит снова получает марш', () => {
        const army = makeArmy();
        const unit = new Unit({ guid: 'u1', x: 5, y: 5, shotCooldown: 2 });
        unit.type = 'soldier';
        unit.speed = 1;
        unit.hp = 20;
        unit.range = 5;
        unit.damage = 5;
        unit.moveGoal = { x: 8, y: 5, reason: 'engage' };
        unit.tacticalTarget = { guid: 'gone' };
        unit.setTarget(8, 5);

        army.units = [unit];
        army.enemyUnits = [];
        army.enemyBuildings = [];

        army.tactics.plan();
        army.tactics.executeMovement();

        expect(unit.moveGoal.reason).toBe('march');
        expect(unit._goalKey).toMatch(/^march:/);

        army.destructor();
    });
});
