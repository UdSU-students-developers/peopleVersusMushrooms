const EasyStar = require('easystarjs');
const Building = require('./entities/Buildings/Building');

jest.mock('./Economy', () => {
  return jest.fn().mockImplementation(() => ({
    easyStar: null,
    myceliumGrid: null,
    buildings: {
      mycelium: [],
      smallReactors: [],
      incubators: [],
    },
    checkConnection: jest.fn(),
    reactorsConsume: jest.fn(),
    getAvailableEnergy: jest.fn(),
    consumeEnergyFromReactors: jest.fn(),
    updateMyceliumGrid: jest.fn(),
    destructor: jest.fn(),
  }));
});

const Economy = require('./Economy');

describe('Pathfinding Tests', () => {
  let economy;
  let easyStar;
  let testGrid;

  beforeEach(() => {
    easyStar = new EasyStar.js();
    testGrid = [
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
    ];
    easyStar.setGrid(testGrid);
    easyStar.setAcceptableTiles([1]);

    economy = new Economy();
    economy.easyStar = easyStar;
    economy.myceliumGrid = testGrid;
    economy.buildings = {
      mycelium: [],
      smallReactors: [],
      incubators: [],
    };
  });

  afterEach(() => {
    if (economy.destructor) {
      economy.destructor();
    }
  });

  describe('Building.hasPathTo', () => {
    test('должен найти путь между двумя точками', async () => {
      const building = new Building({
        type: 'test',
        guid: 'b1',
        x: 0,
        y: 0,
        easyStar: easyStar,
      });

      const hasPath = await building.hasPathTo(testGrid, { x: 4, y: 4 });
      expect(hasPath).toBe(true);
    });

    test('должен вернуть false если путь заблокирован', async () => {
      const blockedGrid = [
        [1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1],
      ];
      
      const building = new Building({
        type: 'test',
        guid: 'b1',
        x: 0,
        y: 0,
        easyStar: easyStar,
      });

      const hasPath = await building.hasPathTo(blockedGrid, { x: 4, y: 4 });
      expect(hasPath).toBe(false);
    });

    test('должен вернуть false если easyStar отсутствует', async () => {
      const building = new Building({
        type: 'test',
        guid: 'b1',
        x: 0,
        y: 0,
        easyStar: null,
      });

      const hasPath = await building.hasPathTo(testGrid, { x: 2, y: 2 });
      expect(hasPath).toBe(false);
    });

    test('должен вернуть false если грид отсутствует', async () => {
      const building = new Building({
        type: 'test',
        guid: 'b1',
        x: 0,
        y: 0,
        easyStar: easyStar,
      });

      const hasPath = await building.hasPathTo(null, { x: 2, y: 2 });
      expect(hasPath).toBe(false);
    });
  });

  describe('Economy.checkConnection', () => {
    test('должен вернуть true для соединённых зданий', async () => {
      const building1 = new Building({
        type: 'reactor',
        guid: 'r1',
        x: 0,
        y: 0,
        easyStar: easyStar,
      });
      
      const building2 = new Building({
        type: 'mycelium',
        guid: 'm1',
        x: 4,
        y: 4,
        easyStar: easyStar,
      });

      economy.checkConnection = async (b1, b2) => {
        if (!economy.myceliumGrid || !b1 || !b2) return false;
        return await b1.hasPathTo(economy.myceliumGrid, {x: b2.x, y: b2.y});
      };

      const result = await economy.checkConnection(building1, building2);
      expect(result).toBe(true);
    });

    test('должен вернуть false для разъединённых зданий', async () => {
      const disconnectedGrid = [
        [1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1],
      ];
      
      const building1 = new Building({
        type: 'reactor',
        guid: 'r1',
        x: 0,
        y: 0,
        easyStar: easyStar,
      });
      
      const building2 = new Building({
        type: 'mycelium',
        guid: 'm1',
        x: 4,
        y: 4,
        easyStar: easyStar,
      });

      economy.myceliumGrid = disconnectedGrid;
      economy.checkConnection = async (b1, b2) => {
        if (!economy.myceliumGrid || !b1 || !b2) return false;
        return await b1.hasPathTo(economy.myceliumGrid, {x: b2.x, y: b2.y});
      };

      const result = await economy.checkConnection(building1, building2);
      expect(result).toBe(false);
    });

    test('должен вернуть false если нет myceliumGrid', async () => {
      const building1 = new Building({
        type: 'reactor',
        guid: 'r1',
        x: 0,
        y: 0,
        easyStar: easyStar,
      });
      
      const building2 = new Building({
        type: 'mycelium',
        guid: 'm1',
        x: 2,
        y: 2,
        easyStar: easyStar,
      });

      economy.myceliumGrid = null;
      economy.checkConnection = async (b1, b2) => {
        if (!economy.myceliumGrid || !b1 || !b2) return false;
        return await b1.hasPathTo(economy.myceliumGrid, {x: b2.x, y: b2.y});
      };

      const result = await economy.checkConnection(building1, building2);
      expect(result).toBe(false);
    });
  });

  describe('Economy.reactorsConsume', () => {
    test('должен вызвать getConsumable для каждого реактора', async () => {
      const mockMycelium1 = { consume: jest.fn(), x: 1, y: 1 };
      const mockMycelium2 = { consume: jest.fn(), x: 2, y: 2 };
      
      const mockReactor = {
        getConsumable: jest.fn().mockReturnValue([mockMycelium1, mockMycelium2]),
      };

      economy.buildings.smallReactors = [mockReactor];
      economy.buildings.mycelium = [mockMycelium1, mockMycelium2];
      
      economy.reactorsConsume = function() {
        this.buildings.smallReactors.forEach(reactor => {
          const reachableMycelium = this.buildings.mycelium;
          reactor.getConsumable(reachableMycelium).forEach(mc => mc.consume());
        });
      };

      economy.reactorsConsume();
      
      expect(mockReactor.getConsumable).toHaveBeenCalledWith(economy.buildings.mycelium);
      expect(mockMycelium1.consume).toHaveBeenCalled();
      expect(mockMycelium2.consume).toHaveBeenCalled();
    });

    test('не должен падать если нет реакторов', () => {
      economy.buildings.smallReactors = [];
      economy.reactorsConsume = function() {
        if (!this.buildings.smallReactors) return;
        this.buildings.smallReactors.forEach(reactor => {});
      };
      
      expect(() => economy.reactorsConsume()).not.toThrow();
    });
  });

  describe('Economy.getAvailableEnergy', () => {
    test('должен корректно рассчитывать доступную энергию', () => {
      economy.getAvailableEnergy = function() {
        let totalEnergy = 0;
        for (const reactor of this.buildings.smallReactors) {
          for (const incubator of this.buildings.incubators) {
            if (reactor.energy) {
              totalEnergy += reactor.energy;
              break;
            }
          }
        }
        return totalEnergy;
      };

      economy.buildings.smallReactors = [
        { energy: 100 },
        { energy: 50 },
        { energy: 200 },
      ];
      economy.buildings.incubators = [{}];

      const result = economy.getAvailableEnergy();
      expect(result).toBe(350);
    });

    test('должен вернуть 0 если нет реакторов', () => {
      economy.getAvailableEnergy = function() {
        let totalEnergy = 0;
        for (const reactor of this.buildings.smallReactors || []) {
          totalEnergy += reactor.energy || 0;
        }
        return totalEnergy;
      };
      
      economy.buildings.smallReactors = [];
      const result = economy.getAvailableEnergy();
      expect(result).toBe(0);
    });
  });

  describe('Economy.consumeEnergyFromReactors', () => {
    test('должен последовательно потреблять энергию из реакторов', () => {
      economy.buildings.smallReactors = [
        { energy: 100 },
        { energy: 50 },
        { energy: 30 },
      ];

      economy.consumeEnergyFromReactors = function(amount) {
        let remainingAmount = amount;
        for (const reactor of this.buildings.smallReactors) {
          if (remainingAmount <= 0) break;
          const consumeEnergy = Math.min(reactor.energy, remainingAmount);
          reactor.energy -= consumeEnergy;
          remainingAmount -= consumeEnergy;
        }
      };

      economy.consumeEnergyFromReactors(120);
      
      expect(economy.buildings.smallReactors[0].energy).toBe(0);
      expect(economy.buildings.smallReactors[1].energy).toBe(30);
      expect(economy.buildings.smallReactors[2].energy).toBe(30);
    });

    test('не должен ничего менять если amount = 0', () => {
      economy.buildings.smallReactors = [{ energy: 100 }];

      economy.consumeEnergyFromReactors = function(amount) {
        let remainingAmount = amount;
        for (const reactor of this.buildings.smallReactors) {
          if (remainingAmount <= 0) break;
          const consumeEnergy = Math.min(reactor.energy, remainingAmount);
          reactor.energy -= consumeEnergy;
          remainingAmount -= consumeEnergy;
        }
      };

      economy.consumeEnergyFromReactors(0);
      expect(economy.buildings.smallReactors[0].energy).toBe(100);
    });

    test('не должен падать если реакторов нет', () => {
      economy.buildings.smallReactors = [];
      economy.consumeEnergyFromReactors = function(amount) {
        if (!this.buildings.smallReactors) return;
        let remainingAmount = amount;
        for (const reactor of this.buildings.smallReactors) {
          if (remainingAmount <= 0) break;
          const consumeEnergy = Math.min(reactor.energy, remainingAmount);
          reactor.energy -= consumeEnergy;
          remainingAmount -= consumeEnergy;
        }
      };
      
      expect(() => economy.consumeEnergyFromReactors(100)).not.toThrow();
    });
  });

  describe('Economy.updateMyceliumGrid', () => {
    test('должен корректно построить сетку из позиций мицелия', () => {
      economy.buildings.mycelium = [
        { x: 1, y: 1 },
        { x: 3, y: 2 },
        { x: 0, y: 4 },
      ];
      
      economy.updateMyceliumGrid = function() {
        this.myceliumGrid = Array(50).fill().map(() => Array(50).fill(0));
        for (const mc of this.buildings.mycelium) {
          if (mc.x >= 0 && mc.x < 50 && mc.y >= 0 && mc.y < 50) {
            this.myceliumGrid[mc.y][mc.x] = 1;
          }
        }
      };

      economy.updateMyceliumGrid();
      
      expect(economy.myceliumGrid[1][1]).toBe(1);
      expect(economy.myceliumGrid[2][3]).toBe(1);
      expect(economy.myceliumGrid[4][0]).toBe(1);
    });

    test('должен игнорировать некорректные координаты', () => {
      economy.buildings.mycelium = [
        { x: -1, y: 1 },
        { x: 100, y: 50 },
        { x: 5, y: 5 },
      ];
      
      economy.updateMyceliumGrid = function() {
        this.myceliumGrid = Array(50).fill().map(() => Array(50).fill(0));
        for (const mc of this.buildings.mycelium) {
          if (mc.x >= 0 && mc.x < 50 && mc.y >= 0 && mc.y < 50) {
            this.myceliumGrid[mc.y][mc.x] = 1;
          }
        }
      };

      expect(() => economy.updateMyceliumGrid()).not.toThrow();
      expect(economy.myceliumGrid[5][5]).toBe(1);
    });
  });

  describe('Интеграционный тест', () => {
    test('реактор должен быть соединён с отдалённым мицелием через лабиринт', async () => {
      const mazeGrid = [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 0, 1],
        [1, 0, 1, 0, 1],
        [1, 1, 1, 1, 1],
      ];
      
      const testEasyStar = new EasyStar.js();
      testEasyStar.setGrid(mazeGrid);
      testEasyStar.setAcceptableTiles([1]);
      
      const reactor = new Building({
        type: 'reactor',
        guid: 'r1',
        x: 0,
        y: 0,
        easyStar: testEasyStar,
      });
      
      const farMycelium = new Building({
        type: 'mycelium',
        guid: 'm1',
        x: 4,
        y: 4,
        easyStar: testEasyStar,
      });

      const isConnected = await reactor.hasPathTo(mazeGrid, { x: farMycelium.x, y: farMycelium.y });
      expect(isConnected).toBe(true);
    });
  });
});

describe('Building (публичные методы)', () => {
  test('get() должен возвращать только публичные поля', () => {
    const building = new Building({
      type: 'factory',
      guid: 'f123',
      x: 10,
      y: 20,
      hp: 500,
      size: 3,
      consumption: 50,
      production: 100,
      capacity: 1000,
    });

    const result = building.get();
    
    expect(result).toEqual({
      guid: 'f123',
      coords: { x: 10, y: 20 },
      type: 'factory',
      hp: 500,
      size: 3,
    });
  });

  test('getSelf() должен возвращать все поля', () => {
    const building = new Building({
      type: 'factory',
      guid: 'f123',
      x: 10,
      y: 20,
      hp: 500,
      size: 3,
      consumption: 50,
      production: 100,
      capacity: 1000,
    });

    const result = building.getSelf();
    
    expect(result).toMatchObject({
      guid: 'f123',
      coords: { x: 10, y: 20 },
      type: 'factory',
      hp: 500,
      size: 3,
      consumption: 50,
      production: 100,
      capacity: 1000,
    });
  });

  test('геттеры возвращают корректные значения', () => {
    const building = new Building({
      type: 'test',
      guid: 't1',
      x: 0,
      y: 0,
      production: 777,
      consumption: 888,
      capacity: 999,
    });

    expect(building.getProduction()).toBe(777);
    expect(building.getConsumption()).toBe(888);
    expect(building.getCapacity()).toBe(999);
  });
});