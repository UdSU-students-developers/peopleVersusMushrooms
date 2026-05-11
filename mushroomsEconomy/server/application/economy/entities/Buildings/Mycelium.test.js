const Mycelium = require('./Mycelium');

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
        DIRECTIONS: [
            { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 0 },                     { dx: 1, dy: 0 },
            { dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 },
        ],
        MYCELIUM: {
            TYPE: 'mycelium',
            HP: 10,
            GROW_SPEED: 10,
            GROW_LEVEL_UP: 100,
            MAX_LEVEL: 3,
            POWER: 50,
            SIZE: 1,
            CONSUMPTION: 0,
            PRODUCTION: 0,
            CAPACITY: 0,
            VISIBILITY: 0,
        },
    },
}));

describe('Mycelium', () => {
    let myc;

    beforeEach(() => {
        myc = new Mycelium({ x: 5, y: 5, guid: 'm1', callbacks: {} });
    });

    it('конструктор передаёт параметры и инициализирует состояние', () => {
        const Building = require('./Building');
        expect(Building).toHaveBeenCalledWith({
            type: 'mycelium', guid: 'm1', x: 5, y: 5, callbacks: {},
            hp: 10, size: 1, consumption: 0, production: 0, capacity: 0, visibility: 0,
        });
        expect(myc.level).toBe(1);
        expect(myc.grow).toBe(0);
        expect(myc.canGrow).toBe(true);
    });

    it('get() возвращает объект с level', () => {
        myc.level = 2;
        expect(myc.get()).toMatchObject({ guid: 'm1', level: 2 });
    });

    it('update() обрабатывает рост и уровни', () => {
        myc.canGrow = false;
        expect(myc.update()).toBe(false);
        expect(myc.grow).toBe(0);

        myc.canGrow = true;
        myc.grow = 50;
        expect(myc.update()).toBe(false);
        expect(myc.grow).toBe(60);

        myc.grow = 95;
        myc.level = 1;
        expect(myc.update()).toBe(true);
        expect(myc.level).toBe(2);
        expect(myc.grow).toBe(0);

        myc.level = 3;
        myc.grow = 100;
        expect(myc.update()).toBe(false);
        expect(myc.canGrow).toBe(false);
        expect(myc.grow).toBe(0);
    });

    it('consume() сбрасывает до начального состояния', () => {
        myc.level = 3;
        myc.grow = 80;
        myc.canGrow = false;
        myc.consume();
        expect(myc.level).toBe(1);
        expect(myc.grow).toBe(0);
        expect(myc.canGrow).toBe(true);
    });

    it('getPower() возвращает мощность', () => {
        expect(myc.getPower()).toBe(50);
    });

    it('_getFreeCells исключает занятые клетки', () => {
        const relief = Array(7).fill().map(() => Array(7).fill(0));
        const neighbour = new Mycelium({ x: 4, y: 5, guid: 'n', callbacks: {} });
        const mycelia = [neighbour];
        const buildings = { clan: [{ x: 5, y: 4, type: 'base' }] };
        const enemy = [{ x: 6, y: 5 }];

        const free = myc._getFreeCells(relief, mycelia, buildings, enemy);
        const coords = free.map(p => `${p.x},${p.y}`).sort();
        expect(coords).toEqual(['4,4', '4,6', '5,6', '6,4', '6,6']);
    });

    it('canExtend возвращает пустой массив при level < MAX_LEVEL', () => {
        myc.level = 2;
        expect(myc.canExtend([[]], [], {}, [])).toEqual([]);
    });

    it('extend сбрасывает и выбирает случайную клетку', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.2);
        myc.level = 3;
        myc.grow = 99;

        const freeCells = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
        const chosen = myc.extend(freeCells);

        expect(chosen).toEqual({ x: 1, y: 2 });
        expect(myc.level).toBe(1);
        expect(myc.grow).toBe(0);
        expect(myc.canGrow).toBe(true);
        Math.random.mockRestore();
    });
});