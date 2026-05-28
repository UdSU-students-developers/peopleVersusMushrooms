import { Army, TArmyState, TBuildingInput, TDamageTarget } from './Army';
import Common from '../modules/common/Common';

const buildArmy = (onTakeDamage?: (target: TDamageTarget) => void): Army => {
    const map = Array.from({ length: 20 }, () => Array(20).fill(0) as (number | null)[]);
    return new Army({
        mapGuid: 'm1',
        map,
        buildings: [],
        guid: 'a1',
        common: new Common(),
        callbacks: {
            update: () => undefined,
            takeDamage: onTakeDamage,
        },
    });
};

describe('Army.updateEnemyEntities — кэш recentlyKilledGuids', () => {
    let army: Army;

    beforeEach(() => {
        army = buildArmy();
    });

    afterEach(() => {
        army.destructor();
    });

    it('после убийства прокси повторное появление того же guid в видимости не воссоздаёт цель', () => {
        const building: TBuildingInput = {
            guid: 'b-mine-1',
            type: 'mine',
            x: 10,
            y: 10,
            hp: 30,
        };

        army.updateEnemyEntities([building]);
        const proxy = army.enemyUnits.find(u => u.guid === 'b-mine-1');
        expect(proxy).toBeDefined();

        proxy!.takeDamage(1000);

        // Map ещё не убрал здание и продолжает возвращать его в visibility
        army.updateEnemyEntities([building]);

        const aliveSameGuid = army.enemyUnits.find(u => u.guid === 'b-mine-1');
        expect(aliveSameGuid).toBeUndefined();
    });

    it('по истечении TTL guid снимается с защиты (мок Date.now)', () => {
        const realNow = Date.now;
        let fakeNow = 1_000_000;
        Date.now = () => fakeNow;

        try {
            const building: TBuildingInput = {
                guid: 'b-pipe-1',
                type: 'pipe',
                x: 5,
                y: 5,
                hp: 20,
            };

            army.updateEnemyEntities([building]);
            army.enemyUnits.find(u => u.guid === 'b-pipe-1')!.takeDamage(9999);

            // Защита активна
            army.updateEnemyEntities([building]);
            expect(army.enemyUnits.find(u => u.guid === 'b-pipe-1')).toBeUndefined();

            // Прокручиваем время за пределы TTL (5000ms по умолчанию)
            fakeNow += 6_000;
            army.updateEnemyEntities([building]);
            expect(army.enemyUnits.find(u => u.guid === 'b-pipe-1')).toBeDefined();
        } finally {
            Date.now = realNow;
        }
    });

    it('callback takeDamage получает type и role цели в объекте', () => {
        const calls: TDamageTarget[] = [];
        const armyWithSpy = buildArmy((target) => { calls.push(target); });

        try {
            armyWithSpy.updateEnemyEntities([{ guid: 'b-1', type: 'barracks', x: 1, y: 1, hp: 50, role: 'peopleEconomy' }]);
            armyWithSpy.enemyUnits.find(u => u.guid === 'b-1')!.takeDamage(10);

            expect(calls).toHaveLength(1);
            expect(calls[0].unitGuid).toBe('b-1');
            expect(calls[0].amount).toBe(10);
            expect(calls[0].type).toBe('barracks');
            expect(calls[0].role).toBe('peopleEconomy');
            expect(calls[0].targetKind).toBe('building');
        } finally {
            armyWithSpy.destructor();
        }
    });
});

// Smoke на форму TArmyState — чтобы тип не разъезжался при правках.
const _shape: TArmyState = {
    map: [],
    units: [],
    enemyUnits: [],
    buildings: [],
    economyUnits: [],
    projectiles: [],
    formation: null,
};
void _shape;
