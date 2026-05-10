const Incubator = require('./Incubator');

jest.mock('../Buildings/Building', () => {
    const MockBuilding = jest.fn(function (options) {
        Object.assign(this, options);
    });
    MockBuilding.prototype.getSelf = jest.fn(function () {
        return {
            type: this.type,
            guid: this.guid,
            x: this.x,
            y: this.y,
            hp: this.hp,
            size: this.size,
            consumption: this.consumption,
            production: this.production,
            capacity: this.capacity,
            visibility: this.visibility,
        };
    });
    return MockBuilding;
});

jest.mock('../../../../config', () => ({
    ECONOMY: {
        INCUBATOR: {
            TYPE: 'incubator',
            HP: 100,
            SIZE: 2,
            CONSUMPTION: 10,
            PRODUCTION: 5,
            CAPACITY: 50,
            LARVA_ENERGY_COST: 20,
            LARVA_COOLDOWN_MS: 5000,
            VISIBILITY: 3,
        },
    },
}));

describe('Incubator', () => {
    let incubator, callbacks;

    beforeEach(() => {
        callbacks = {
            getMap: jest.fn(),
            addLarva: jest.fn(),
        };
        incubator = new Incubator({ guid: 'inc1', x: 2, y: 2, callbacks });
    });

    it('конструктор передаёт параметры в Building и задаёт свойства личинок', () => {
        const Building = require('../Buildings/Building');
        expect(Building).toHaveBeenCalledWith({
            type: 'incubator', guid: 'inc1', x: 2, y: 2, callbacks,
            hp: 100, size: 2, consumption: 10, production: 5,
            capacity: 50, visibility: 3,
        });
        expect(incubator.larvaEnergyCost).toBe(20);
        expect(incubator.larvaCooldownMs).toBe(5000);
        expect(incubator.lastLarvaeCreateAt).toBe(0);
    });

    it('getSelf возвращает объединённый объект с доп. полями', () => {
        incubator.larvaEnergyCost = 20;
        incubator.larvaCooldownMs = 5000;
        incubator.lastLarvaeCreateAt = 999;

        expect(incubator.getSelf()).toMatchObject({
            type: 'incubator',
            guid: 'inc1',
            larvaEnergyCost: 20,
            larvaCooldownMs: 5000,
            lastLarvaeCreateAt: 999,
        });
    });

    it('isCooldownReady правильно считает кулдаун', () => {
        incubator.lastLarvaeCreateAt = 1000;
        expect(incubator.isCooldownReady(6000)).toBe(true);
        expect(incubator.isCooldownReady(5999)).toBe(false);
    });

    it('getFreeCellsAround возвращает только свободные клетки', () => {
        callbacks.getMap.mockReturnValue([
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1],
        ]);

        const free = incubator.getFreeCellsAround();
        const result = free.map(p => `${p.x},${p.y}`).sort();
        expect(result).toEqual([
            '1,1', '1,2', '1,3',
            '2,1', '2,3',
            '3,1', '3,2', '3,3',
        ]);
    });

    it('createLarvae возвращает null при невыполнении условий', () => {
        incubator.lastLarvaeCreateAt = Date.now();
        expect(incubator.createLarvae({ availableEnergy: 100 })).toBeNull();

        incubator.lastLarvaeCreateAt = 0;
        callbacks.getMap.mockReturnValue([[1]]);
        incubator.x = 0;
        incubator.y = 0;
        expect(incubator.createLarvae({ availableEnergy: 100, now: 5000 })).toBeNull();

        callbacks.getMap.mockReturnValue([[0]]);
        expect(incubator.createLarvae({ availableEnergy: 5, now: 5000 })).toBeNull();
    });

    it('createLarvae создаёт личинку и обновляет время', () => {
        callbacks.getMap.mockReturnValue([
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ]);
        jest.spyOn(Math, 'random').mockReturnValue(0.3);

        const result = incubator.createLarvae({ availableEnergy: 100, now: 5000 });

        expect(result).not.toBeNull();
        expect(result.energySpent).toBe(20);
        expect(callbacks.addLarva).toHaveBeenCalledWith(
            result.x, result.y, incubator.x, incubator.y
        );
        expect(incubator.lastLarvaeCreateAt).toBe(5000);

        Math.random.mockRestore();
    });
});