const Army = require('../Army');
const { pickEngageTarget, pickShootTarget } = require('./targeting');

function makeArmy() {
    return new Army({
        guids: { mushroomsArmy: 'a', mushroomsEconomy: 'e' },
        guid: 'p',
        common: { guid: () => 'g' },
        callbacks: { update: jest.fn(), takeDamage: jest.fn() },
        map: Array.from({ length: 10 }, () => Array(10).fill(0)),
    });
}

describe('simplified targeting', () => {
    test('soldier идёт к ближайшему юниту, а не от здания', () => {
        const army = makeArmy();
        const unit = { guid: 'u1', type: 'soldier', x: 0, y: 0, range: 8 };
        army.enemyUnits = [
            { guid: 'eu', x: 2, y: 0, hp: 20 },
        ];
        army.enemyBuildings = [
            { guid: 'eb', x: 8, y: 0, hp: 5, size: 1 },
        ];

        const sense = {
            hasVisibleEnemies: true,
            units: army.enemyUnits.map((u) => ({ ...u, targetKind: 'unit' })),
            buildings: army.enemyBuildings.map((b) => ({ ...b, targetKind: 'building' })),
        };

        const pick = pickEngageTarget(army, unit, sense);
        expect(pick.target.guid).toBe('eu');

        army.destructor();
    });

    test('bmp предпочитает здание в радиусе стрельбы', () => {
        const army = makeArmy();
        const unit = { guid: 'u1', type: 'bmp', x: 0, y: 0, range: 8, damage: 10 };
        army.enemyUnits = [{ guid: 'eu', x: 2, y: 0, hp: 50 }];
        army.enemyBuildings = [{ guid: 'eb', x: 3, y: 0, hp: 10, size: 1 }];

        const target = pickShootTarget(army, unit, army.enemyUnits, army.enemyBuildings, army.map);
        expect(target.guid).toBe('eb');

        army.destructor();
    });

    test('пиздоглядов не выбирают как цель для движения и стрельбы', () => {
        const army = makeArmy();
        const unit = { guid: 'u1', type: 'soldier', x: 0, y: 0, range: 8 };

        army.enemyUnits = [
            { guid: 'scout', x: 1, y: 0, hp: 2, type: 'pizdoglyad' },
        ];
        army.enemyBuildings = [];

        const sense = {
            hasVisibleEnemies: false,
            units: [],
            buildings: [],
        };

        expect(pickEngageTarget(army, unit, sense).target).toBeNull();
        expect(pickShootTarget(army, unit, army.enemyUnits, army.enemyBuildings, army.map)).toBeNull();

        army.enemyUnits.push({ guid: 'fighter', x: 2, y: 0, hp: 20, type: 'sporomet' });
        const senseWithFighter = {
            hasVisibleEnemies: true,
            units: [{ ...army.enemyUnits[1], targetKind: 'unit' }],
            buildings: [],
        };
        expect(pickEngageTarget(army, unit, senseWithFighter).target.guid).toBe('fighter');

        army.destructor();
    });
});
