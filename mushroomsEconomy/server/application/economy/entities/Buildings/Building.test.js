const Building = require('./Building');
const EasyStar = require('easystarjs');

jest.mock('easystarjs');

describe('Building.hasPathTo', () => {
  let building;
  let mockEasyStar;
  let grid;

  beforeEach(() => {
    mockEasyStar = {
      setGrid: jest.fn(),
      setAcceptableTiles: jest.fn(),
      findPath: jest.fn(),
      calculate: jest.fn(),
    };
    
    EasyStar.js.mockImplementation(() => mockEasyStar);
    
    building = new Building({
      type: 'test',
      guid: 'test-guid',
      x: 2,
      y: 3,
      easyStar: mockEasyStar,
    });
    
    grid = [
      [1, 1, 0, 0],
      [1, 0, 1, 0],
      [0, 1, 1, 1],
      [0, 0, 1, 1],
    ];
  });

  test('должен установить корректный грид и допустимые тайлы', async () => {
    mockEasyStar.findPath.mockImplementation((x1, y1, x2, y2, cb) => cb([{x:2,y:3}]));
    
    await building.hasPathTo(grid, { x: 0, y: 0 });
    
    expect(mockEasyStar.setGrid).toHaveBeenCalledWith(grid);
    expect(mockEasyStar.setAcceptableTiles).toHaveBeenCalledWith([1]);
    expect(mockEasyStar.calculate).toHaveBeenCalled();
  });

  test('должен корректно обработать асинхронный колбэк', async () => {
    const expectedPath = [{ x: 2, y: 3 }, { x: 2, y: 2 }, { x: 1, y: 2 }];
    mockEasyStar.findPath.mockImplementation((x1, y1, x2, y2, callback) => {
      callback(expectedPath);
    });
    
    const result = await building.hasPathTo(grid, { x: 0, y: 0 });
    expect(result).toBe(true);
  });

  test('должен вернуть false при пустом пути', async () => {
    mockEasyStar.findPath.mockImplementation((x1, y1, x2, y2, callback) => {
      callback(null);
    });
    
    const result = await building.hasPathTo(grid, { x: 0, y: 0 });
    expect(result).toBe(false);
  });

  test('должен вернуть false при пустом массиве пути', async () => {
    mockEasyStar.findPath.mockImplementation((x1, y1, x2, y2, callback) => {
      callback([]);
    });
    
    const result = await building.hasPathTo(grid, { x: 0, y: 0 });
    expect(result).toBe(false);
  });
});