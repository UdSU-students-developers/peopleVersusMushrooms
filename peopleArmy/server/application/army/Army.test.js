const Army = require('./Army');

// ─── фабрики ─────────────────────────────────────────────────────────────────

function makeArmy(overrides = {}) {
    return new Army({
        guids: { mushroomsArmy: 'army-guid', mushroomsEconomy: 'eco-guid' },
        guid: 'people-army',
        common: { guid: () => 'gen-guid' },
        callbacks: {
            update: jest.fn(),
            takeDamage: jest.fn().mockResolvedValue(null),
        },
        map: Array.from({ length: 10 }, () => Array(10).fill(0)),
        buildings: [],
        unitTypes: {},
        ...overrides,
    });
}

/** Атакующий юнит (наш) */
const makeUnit = (overrides = {}) => ({
    guid: 'attacker',
    type: 'soldier',
    x: 5, y: 5,
    range: 3,
    damage: 10,
    hp: 100,
    ...overrides,
});

/** Вражеский юнит */
const makeEnemy = (overrides = {}) => ({
    guid: 'enemy-1',
    x: 6, y: 5,
    hp: 50,
    ...overrides,
});

/** Вражеское здание */
const makeBuilding = (overrides = {}) => ({
    guid: 'building-1',
    x: 7, y: 5,
    hp: 80,
    size: 1,
    ...overrides,
});

// ─── setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
});

// ─── getTargetDistanceSquared ─────────────────────────────────────────────────

describe('getTargetDistanceSquared', () => {
    let army;
    beforeEach(() => { army = makeArmy(); });

    test('расстояние до точечной цели (size=0)', () => {
        const unit = makeUnit({ x: 0, y: 0 });
        const target = makeBuilding({ x: 3, y: 4, size: 0 });
        expect(army.getTargetDistanceSquared(unit, target)).toBe(3 * 3 + 4 * 4); // 25
    });

    test('расстояние до здания size=2: юнит внутри футпринта → 0', () => {
        const unit = makeUnit({ x: 3, y: 3 });
        const target = makeBuilding({ x: 2, y: 2, size: 2 }); // занимает 2,2 – 3,3
        expect(army.getTargetDistanceSquared(unit, target)).toBe(0);
    });

    test('расстояние до здания size=2: юнит строго правее', () => {
        const unit = makeUnit({ x: 5, y: 2 });
        const target = makeBuilding({ x: 2, y: 2, size: 2 }); // maxX=4
        // dx = 5 - 4 = 1, dy = 0
        expect(army.getTargetDistanceSquared(unit, target)).toBe(1);
    });

    test('расстояние до здания size=2: юнит по диагонали', () => {
        const unit = makeUnit({ x: 6, y: 6 });
        const target = makeBuilding({ x: 2, y: 2, size: 2 }); // maxX=4, maxY=4
        // dx = 6-4=2, dy = 6-4=2
        expect(army.getTargetDistanceSquared(unit, target)).toBe(8);
    });

    test('юнит слева от цели', () => {
        const unit = makeUnit({ x: 0, y: 3 });
        const target = makeBuilding({ x: 4, y: 3, size: 0 });
        expect(army.getTargetDistanceSquared(unit, target)).toBe(16);
    });
});

// ─── getUnitsInRange ──────────────────────────────────────────────────────────

describe('getUnitsInRange', () => {
    let army;
    beforeEach(() => { army = makeArmy(); });

    test('возвращает врагов в радиусе', () => {
        const unit = makeUnit({ x: 0, y: 0, range: 5 });
        const near = makeEnemy({ guid: 'near', x: 3, y: 4, hp: 10 }); // dist²=25, range²=25 ✓
        const far = makeEnemy({ guid: 'far', x: 4, y: 4, hp: 10 });   // dist²=32 ✗
        expect(army.getUnitsInRange(unit, [near, far])).toEqual([near]);
    });

    test('враг с hp=0 не входит в радиус', () => {
        const unit = makeUnit({ x: 0, y: 0, range: 10 });
        const dead = makeEnemy({ x: 1, y: 0, hp: 0 });
        expect(army.getUnitsInRange(unit, [dead])).toEqual([]);
    });

    test('враг с isAlive=false не входит в радиус', () => {
        const unit = makeUnit({ x: 0, y: 0, range: 10 });
        const dead = makeEnemy({ x: 1, y: 0, hp: 20, isAlive: false });
        expect(army.getUnitsInRange(unit, [dead])).toEqual([]);
    });

    test('возвращает пустой массив при range=0', () => {
        const unit = makeUnit({ x: 0, y: 0, range: 0 });
        const enemy = makeEnemy({ x: 1, y: 0, hp: 10 });
        expect(army.getUnitsInRange(unit, [enemy])).toEqual([]);
    });

    test('возвращает пустой массив при null unit', () => {
        expect(army.getUnitsInRange(null, [makeEnemy()])).toEqual([]);
    });
});

// ─── getShootableTargets ──────────────────────────────────────────────────────

describe('getShootableTargets', () => {
    let army;
    beforeEach(() => { army = makeArmy(); });

    test('юниты помечаются targetKind="unit"', () => {
        army.enemyUnits = [makeEnemy({ guid: 'u1' })];
        const { units } = army.getShootableTargets();
        expect(units[0].targetKind).toBe('unit');
    });

    test('здания помечаются targetKind="building"', () => {
        army.enemyBuildings = [makeBuilding({ guid: 'b1' })];
        const { buildings } = army.getShootableTargets();
        expect(buildings[0].targetKind).toBe('building');
    });

    test('здание без guid фильтруется', () => {
        army.enemyBuildings = [{ x: 1, y: 1, hp: 10 }]; // без guid
        const { buildings } = army.getShootableTargets();
        expect(buildings).toHaveLength(0);
    });

    test('hp здания нормализуется: не-число заменяется на 1', () => {
        army.enemyBuildings = [makeBuilding({ guid: 'b1', hp: 'bad' })];
        const { buildings } = army.getShootableTargets();
        expect(buildings[0].hp).toBe(1);
    });

    test('hp здания нормализуется: число сохраняется', () => {
        army.enemyBuildings = [makeBuilding({ guid: 'b1', hp: 42 })];
        const { buildings } = army.getShootableTargets();
        expect(buildings[0].hp).toBe(42);
    });
});

// ─── shotUnits: приоритеты ────────────────────────────────────────────────────

describe('shotUnits — приоритет целей', () => {
    let army;
    let takeDamage;

    beforeEach(() => {
        takeDamage = jest.fn().mockResolvedValue(null);
        army = makeArmy({ callbacks: { update: jest.fn(), takeDamage } });
    });

    // ── soldier / sniper: сначала юниты ──────────────────────────────────────

    test.each(['soldier', 'sniper'])(
        '%s при наличии юнитов и зданий в радиусе атакует юнита',
        async (type) => {
            army.units = [makeUnit({ type, x: 0, y: 0, range: 5, damage: 10 })];
            army.enemyUnits = [makeEnemy({ guid: 'eu', x: 1, y: 0, hp: 20 })];
            army.enemyBuildings = [makeBuilding({ guid: 'eb', x: 2, y: 0, hp: 5 })];

            await army.shotUnits();

            expect(takeDamage).toHaveBeenCalledTimes(1);
            expect(takeDamage).toHaveBeenCalledWith(expect.objectContaining({
                unitGuid: 'eu',
                targetKind: 'unit',
            }));
        }
    );

    test.each(['soldier', 'sniper'])(
        '%s без юнитов в радиусе атакует здание (fallback)',
        async (type) => {
            army.units = [makeUnit({ type, x: 0, y: 0, range: 5, damage: 10 })];
            army.enemyUnits = [makeEnemy({ guid: 'eu', x: 20, y: 20, hp: 20 })]; // вне радиуса
            army.enemyBuildings = [makeBuilding({ guid: 'eb', x: 1, y: 0, hp: 5 })];

            await army.shotUnits();

            expect(takeDamage).toHaveBeenCalledWith(expect.objectContaining({
                unitGuid: 'eb',
                targetKind: 'building',
            }));
        }
    );

    // ── partizan / bmp: сначала здания ────────────────────────────────────────

    test.each(['partizan', 'bmp'])(
        '%s при наличии юнитов и зданий в радиусе атакует здание',
        async (type) => {
            army.units = [makeUnit({ type, x: 0, y: 0, range: 5, damage: 10 })];
            army.enemyUnits = [makeEnemy({ guid: 'eu', x: 1, y: 0, hp: 5 })];
            army.enemyBuildings = [makeBuilding({ guid: 'eb', x: 2, y: 0, hp: 20 })];

            await army.shotUnits();

            expect(takeDamage).toHaveBeenCalledWith(expect.objectContaining({
                unitGuid: 'eb',
                targetKind: 'building',
            }));
        }
    );

    test.each(['partizan', 'bmp'])(
        '%s без зданий в радиусе атакует юнита (fallback)',
        async (type) => {
            army.units = [makeUnit({ type, x: 0, y: 0, range: 5, damage: 10 })];
            army.enemyUnits = [makeEnemy({ guid: 'eu', x: 1, y: 0, hp: 20 })];
            army.enemyBuildings = [makeBuilding({ guid: 'eb', x: 20, y: 20, hp: 5 })]; // вне радиуса

            await army.shotUnits();

            expect(takeDamage).toHaveBeenCalledWith(expect.objectContaining({
                unitGuid: 'eu',
                targetKind: 'unit',
            }));
        }
    );
});

// ─── shotUnits: выбор наислабейшего ──────────────────────────────────────────

describe('shotUnits — атака наислабейшего', () => {
    let army;
    let takeDamage;

    beforeEach(() => {
        takeDamage = jest.fn().mockResolvedValue(null);
        army = makeArmy({ callbacks: { update: jest.fn(), takeDamage } });
    });

    test('soldier бьёт юнита с минимальным hp из нескольких', async () => {
        army.units = [makeUnit({ type: 'soldier', x: 0, y: 0, range: 10, damage: 5 })];
        army.enemyUnits = [
            makeEnemy({ guid: 'e-strong', x: 1, y: 0, hp: 80 }),
            makeEnemy({ guid: 'e-weak',   x: 2, y: 0, hp: 10 }),
            makeEnemy({ guid: 'e-mid',    x: 3, y: 0, hp: 40 }),
        ];

        await army.shotUnits();

        expect(takeDamage).toHaveBeenCalledWith(expect.objectContaining({ unitGuid: 'e-weak' }));
    });

    test('partizan бьёт здание с минимальным hp из нескольких', async () => {
        army.units = [makeUnit({ type: 'partizan', x: 0, y: 0, range: 10, damage: 5 })];
        army.enemyBuildings = [
            makeBuilding({ guid: 'b-strong', x: 1, y: 0, hp: 100 }),
            makeBuilding({ guid: 'b-weak',   x: 2, y: 0, hp: 15 }),
            makeBuilding({ guid: 'b-mid',    x: 3, y: 0, hp: 50 }),
        ];

        await army.shotUnits();

        expect(takeDamage).toHaveBeenCalledWith(expect.objectContaining({ unitGuid: 'b-weak' }));
    });

    test('при равном hp бьёт любого из равнослабых (не падает)', async () => {
        army.units = [makeUnit({ type: 'soldier', x: 0, y: 0, range: 10, damage: 5 })];
        army.enemyUnits = [
            makeEnemy({ guid: 'e1', x: 1, y: 0, hp: 30 }),
            makeEnemy({ guid: 'e2', x: 2, y: 0, hp: 30 }),
        ];

        await army.shotUnits();

        expect(takeDamage).toHaveBeenCalledTimes(1);
        expect(['e1', 'e2']).toContain(takeDamage.mock.calls[0][0].unitGuid);
    });
});

// ─── shotUnits: параметры колбэка ─────────────────────────────────────────────

describe('shotUnits — параметры takeDamage', () => {
    let army;
    let takeDamage;

    beforeEach(() => {
        takeDamage = jest.fn().mockResolvedValue(null);
        army = makeArmy({ callbacks: { update: jest.fn(), takeDamage } });
    });

    test('передаёт armyGuid из guids.mushroomsArmy', async () => {
        army.units = [makeUnit({ type: 'soldier', x: 0, y: 0, range: 5, damage: 7 })];
        army.enemyUnits = [makeEnemy({ guid: 'e1', x: 1, y: 0, hp: 20 })];

        await army.shotUnits();

        expect(takeDamage).toHaveBeenCalledWith(expect.objectContaining({ armyGuid: 'army-guid' }));
    });

    test('передаёт economyGuid из guids.mushroomsEconomy', async () => {
        army.units = [makeUnit({ type: 'partizan', x: 0, y: 0, range: 5, damage: 7 })];
        army.enemyBuildings = [makeBuilding({ guid: 'b1', x: 1, y: 0, hp: 20 })];

        await army.shotUnits();

        expect(takeDamage).toHaveBeenCalledWith(expect.objectContaining({ economyGuid: 'eco-guid' }));
    });

    test('amount равен unit.damage', async () => {
        army.units = [makeUnit({ type: 'soldier', x: 0, y: 0, range: 5, damage: 42 })];
        army.enemyUnits = [makeEnemy({ guid: 'e1', x: 1, y: 0, hp: 100 })];

        await army.shotUnits();

        expect(takeDamage).toHaveBeenCalledWith(expect.objectContaining({ amount: 42 }));
    });

    test('каждый наш юнит стреляет отдельно', async () => {
        army.units = [
            makeUnit({ guid: 'a1', type: 'soldier', x: 0, y: 0, range: 5, damage: 5 }),
            makeUnit({ guid: 'a2', type: 'sniper',  x: 0, y: 1, range: 5, damage: 8 }),
        ];
        army.enemyUnits = [makeEnemy({ guid: 'e1', x: 1, y: 0, hp: 50 })];

        await army.shotUnits();

        expect(takeDamage).toHaveBeenCalledTimes(2);
    });
});

// ─── shotUnits: граничные случаи ──────────────────────────────────────────────

describe('shotUnits — граничные случаи', () => {
    let army;
    let takeDamage;

    beforeEach(() => {
        takeDamage = jest.fn().mockResolvedValue(null);
        army = makeArmy({ callbacks: { update: jest.fn(), takeDamage } });
    });

    test('нет наших юнитов → колбэк не вызывается', async () => {
        army.units = [];
        army.enemyUnits = [makeEnemy()];

        await army.shotUnits();

        expect(takeDamage).not.toHaveBeenCalled();
    });

    test('нет врагов и зданий → колбэк не вызывается', async () => {
        army.units = [makeUnit()];

        await army.shotUnits();

        expect(takeDamage).not.toHaveBeenCalled();
    });

    test('враг с hp=0 игнорируется', async () => {
        army.units = [makeUnit({ x: 0, y: 0, range: 10 })];
        army.enemyUnits = [makeEnemy({ x: 1, y: 0, hp: 0 })];

        await army.shotUnits();

        expect(takeDamage).not.toHaveBeenCalled();
    });

    test('враг с isAlive=false игнорируется', async () => {
        army.units = [makeUnit({ x: 0, y: 0, range: 10 })];
        army.enemyUnits = [makeEnemy({ x: 1, y: 0, hp: 20, isAlive: false })];

        await army.shotUnits();

        expect(takeDamage).not.toHaveBeenCalled();
    });

    test('все цели вне радиуса → колбэк не вызывается', async () => {
        army.units = [makeUnit({ x: 0, y: 0, range: 1 })];
        army.enemyUnits = [makeEnemy({ x: 9, y: 9, hp: 20 })];
        army.enemyBuildings = [makeBuilding({ guid: 'b1', x: 8, y: 8, hp: 10 })];

        await army.shotUnits();

        expect(takeDamage).not.toHaveBeenCalled();
    });

    test('нет колбэка takeDamage → не падает', async () => {
        army.callbacks = { update: jest.fn() };
        army.units = [makeUnit()];
        army.enemyUnits = [makeEnemy()];

        await expect(army.shotUnits()).resolves.toBeUndefined();
    });
});

// ─── moveUnits: остановка при наличии целей ───────────────────────────────────

describe('moveUnits — остановка при целях в радиусе', () => {
    let army;

    beforeEach(() => {
        army = makeArmy();
    });

    test('юнит останавливается при враге в радиусе', () => {
        const unit = makeUnit({ x: 0, y: 0, range: 5, path: [{ x: 1, y: 0 }], walkPoints: 3 });
        unit.move = jest.fn();
        army.units = [unit];
        army.enemyUnits = [makeEnemy({ x: 1, y: 0, hp: 20 })];

        army.moveUnits();

        expect(unit.path).toEqual([]);
        expect(unit.walkPoints).toBe(0);
        expect(unit.move).not.toHaveBeenCalled();
    });

    test('юнит останавливается при здании в радиусе', () => {
        const unit = makeUnit({ x: 0, y: 0, range: 5, path: [{ x: 1, y: 0 }], walkPoints: 3 });
        unit.move = jest.fn();
        army.units = [unit];
        army.enemyBuildings = [makeBuilding({ guid: 'b1', x: 2, y: 0, hp: 50 })];

        army.moveUnits();

        expect(unit.path).toEqual([]);
        expect(unit.walkPoints).toBe(0);
        expect(unit.move).not.toHaveBeenCalled();
    });

    test('юнит продолжает движение если нет целей в радиусе', () => {
        const unit = makeUnit({ x: 0, y: 0, range: 1, path: [], walkPoints: 0 });
        unit.move = jest.fn().mockReturnValue(false);
        army.units = [unit];
        army.enemyUnits = [makeEnemy({ x: 9, y: 9, hp: 20 })];

        army.moveUnits();

        expect(unit.move).toHaveBeenCalled();
    });
});
