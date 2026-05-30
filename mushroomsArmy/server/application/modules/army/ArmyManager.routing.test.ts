import { resolveDamageRoute, TArmyGuids } from './ArmyManager';

const GLOBAL_CONFIG = require('../../../../../global/globalConfig');

const FULL_GUIDS: TArmyGuids = {
    peopleArmyGuid: 'pa-guid-1',
    mushroomsEconomyGuid: 'me-guid-1',
    peopleEconomyGuid: 'pe-guid-1',
};

describe('resolveDamageRoute', () => {
    describe('здания peopleEconomy → peopleEconomy /damage', () => {
        const economyTypes = ['mine', 'driller', 'pipe', 'barracks', 'smallGenerator'];

        for (const type of economyTypes) {
            it(`type=${type}: маршрут к peopleEconomy`, () => {
                const route = resolveDamageRoute(type, 'target-guid', 25, FULL_GUIDS);
                expect(route).not.toBeNull();
                expect(route!.url).toBe(`${GLOBAL_CONFIG.PEOPLE_ECONOMY.URL}${GLOBAL_CONFIG.URLS.DAMAGE}`);
                expect(route!.body).toEqual({
                    guid: 'target-guid',
                    damage: 25,
                    economyGuid: 'pe-guid-1',
                });
            });
        }

        it('если peopleEconomyGuid отсутствует → null', () => {
            const route = resolveDamageRoute('mine', 'g', 10, {
                peopleArmyGuid: 'pa',
                mushroomsEconomyGuid: null,
                peopleEconomyGuid: null,
            });
            expect(route).toBeNull();
        });
    });

    describe('юниты peopleArmy → peopleArmy /unit/takeDamage', () => {
        const armyTypes = ['soldier', 'bmp', 'sniper', 'partizan'];

        for (const type of armyTypes) {
            it(`type=${type}: маршрут к peopleArmy`, () => {
                const route = resolveDamageRoute(type, 'u-guid', 15, FULL_GUIDS);
                expect(route).not.toBeNull();
                expect(route!.url).toBe(`${GLOBAL_CONFIG.PEOPLE_ARMY.URL}${GLOBAL_CONFIG.URLS.TAKE_DAMAGE_PEOPLE_ARMY}`);
                expect(route!.body).toEqual({
                    userGuid: 'pa-guid-1',
                    unitGuid: 'u-guid',
                    damage: 15,
                });
            });
        }

        it('если peopleArmyGuid отсутствует → null', () => {
            const route = resolveDamageRoute('soldier', 'g', 10, {
                peopleArmyGuid: null,
                mushroomsEconomyGuid: 'me',
                peopleEconomyGuid: 'pe',
            });
            expect(route).toBeNull();
        });
    });

    it('неизвестный тип цели идёт в peopleArmy (fallback)', () => {
        // Тип не из PEOPLE_ECONOMY_BUILDING_TYPES — попадает в ветку peopleArmy.
        const route = resolveDamageRoute('unknown_type', 'g', 5, FULL_GUIDS);
        expect(route).not.toBeNull();
        expect(route!.url).toContain(GLOBAL_CONFIG.PEOPLE_ARMY.URL);
    });
});
