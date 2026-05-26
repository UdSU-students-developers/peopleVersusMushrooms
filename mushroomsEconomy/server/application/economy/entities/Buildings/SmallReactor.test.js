const SmallReactor = require('./SmallReactor');

jest.mock("./Building", () => {
    const MockBuilding = jest.fn(function (options) {
        Object.assign(this, options);
    });
    MockBuilding.prototype.get = jest.fn(function () {
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

jest.mock("../../../../config", () => ({
    ECONOMY: {
        BIO_REACTOR_SMALL: {
            TYPE: 'small_reactor',
            HP: 80,
            SIZE: 1,
            CONSUMPTION: 0,
            PRODUCTION: 0,
            CAPACITY: 500,
            VISIBILITY: 2,
            CONSUME_RADIUS: 1,          
        },
        MYCELIUM: {
            MAX_LEVEL: 3,
        },
    },
}));

describe('SmallReactor', () => {
    let reactor, mycelium;

    beforeEach(() => {
        reactor = new SmallReactor({ guid: 'r1', x: 3, y: 3, callbacks: {} });
        mycelium = [
            { x: 2, y: 2, level: 3, getPower: jest.fn(() => 100), consume: jest.fn() },
            { x: 2, y: 3, level: 2, getPower: jest.fn(), consume: jest.fn() },
            { x: 3, y: 2, level: 3, getPower: jest.fn(() => 150), consume: jest.fn() },
            { x: 4, y: 4, level: 3, getPower: jest.fn(() => 200), consume: jest.fn() },
            { x: 5, y: 5, level: 3, getPower: jest.fn(), consume: jest.fn() },
        ];
    });

    it('конструктор передаёт параметры и выставляет energy/consumed', () => {
        const Building = require('./Building');
        expect(Building).toHaveBeenCalledWith({
            type: 'small_reactor', guid: 'r1', x: 3, y: 3, callbacks: {},
            hp: 80, size: 1, consumption: 0, production: 0, capacity: 500, visibility: 2,
        });
        expect(reactor.energy).toBe(0);
        expect(reactor.consumed).toBe(false);
    });

    it('get() добавляет energy и consumed', () => {
        reactor.energy = 120;
        reactor.consumed = true;
        expect(reactor.get()).toMatchObject({
            type: 'small_reactor', guid: 'r1', energy: 120, consumed: true,
        });
    });

    it('getConsumable() возвращает соседние зрелые мицелии', () => {
        const result = reactor.getConsumable(mycelium);
        const coords = result.map(m => `${m.x},${m.y}`).sort();
        expect(coords).toEqual(['2,2', '3,2', '4,4']);
    });

    it('consumeMycelium() накапливает энергию и вызывает consume у съеденных', () => {
        reactor.capacity = 300;
        const result = reactor.consumeMycelium(mycelium);

        expect(result).toBe(3);
        expect(reactor.energy).toBe(300); // 100 + 150 + 200 = 450, но cap 300
        expect(reactor.consumed).toBe(true);
        expect(mycelium[0].consume).toHaveBeenCalled();
        expect(mycelium[2].consume).toHaveBeenCalled();
        expect(mycelium[3].consume).toHaveBeenCalled();
        expect(mycelium[1].consume).not.toHaveBeenCalled();
    });

    it('consumeMushroom() обновляет consumed и возвращает его', () => {
        reactor.capacity = 1000;
        const result = reactor.consumeMushroom(mycelium);
        expect(result).toBe(true);
        expect(reactor.consumed).toBe(true);

        const empty = reactor.consumeMushroom([]);
        expect(empty).toBe(false);
        expect(reactor.consumed).toBe(false);
    });

    it('consumeMycelium() устанавливает consumed = false при пустом списке', () => {
        reactor.consumed = true;
        reactor.consumeMycelium([]);
        expect(reactor.consumed).toBe(false);
    });
});