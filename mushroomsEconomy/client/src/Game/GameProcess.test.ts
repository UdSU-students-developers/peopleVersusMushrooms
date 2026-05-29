import GameProcess from './GameProcess';
import CONFIG from '../config';
import Server from "../services/Server/Server";
import Mediator from "../services/Mediator/Mediator";
import { TScene, TRelief } from '../services/Server/types';

const { START_GAME, UPDATE_SCENE, RELIEF_LOADED } = CONFIG.SOCKET;

const createMockScene = (overrides: Partial<TScene> = {}): TScene => ({
  guid: 'test-scene-guid',
  buildings: { reactors: [], incubators: [], mycelium: [], mines: [] },
  enemyBuildings: [],
  map: { relief: [], resurces: [] },
  units: { workers: [], larvae: [], geodezists: [] },
  ...overrides,
});

describe('GameProcess', () => {
  let mockServer: Server;
  let mockMediator: Mediator;
  let gameProcess: GameProcess;

  beforeEach(() => {
    mockServer = {} as Server;
    mockMediator = {
      subscribe: jest.fn(),
    } as unknown as Mediator;

    gameProcess = new GameProcess(mockServer, mockMediator);
  });

  describe('конструктор', () => {
    it('должен подписаться на START_GAME, UPDATE_SCENE и RELIEF_LOADED', () => {
      expect(mockMediator.subscribe).toHaveBeenCalledTimes(3);
      expect(mockMediator.subscribe).toHaveBeenCalledWith(START_GAME, expect.any(Function));
      expect(mockMediator.subscribe).toHaveBeenCalledWith(UPDATE_SCENE, expect.any(Function));
      expect(mockMediator.subscribe).toHaveBeenCalledWith(RELIEF_LOADED, expect.any(Function));
    });
  });

  describe('startGame', () => {
    it('должен установить сцену и вывести сообщение в лог', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const scene = createMockScene({ guid: 'start-scene' });

      gameProcess.startGame(scene);

      expect(gameProcess.scene).toBe(scene);
      expect(consoleSpy).toHaveBeenCalledWith('Iya startanUUUlsOO!!1', scene);
      consoleSpy.mockRestore();
    });
  });

  describe('updateScene', () => {
    it('должен заменить сцену переданными данными', () => {
      const scene = createMockScene({ guid: 'update-scene' });

      gameProcess.updateScene(scene);

      expect(gameProcess.scene).toBe(scene);
    });
  });

  describe('reliefLoaded', () => {
    it('должен только вывести сообщение в лог, если сцена равна null', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const relief: TRelief = [[1, 2], [3, 4]];

      gameProcess.scene = null;
      gameProcess.reliefLoaded(relief);

      expect(consoleSpy).toHaveBeenCalledWith('Relief loaded');
      expect(gameProcess.scene).toBeNull();
      consoleSpy.mockRestore();
    });

    it('должен установить scene.map.relief, если сцена существует', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const relief: TRelief = [[5, 6]];
      const scene = createMockScene();

      gameProcess.scene = scene;
      gameProcess.reliefLoaded(relief);

      expect(consoleSpy).toHaveBeenCalledWith('Relief loaded');
      expect(scene.map.relief).toBe(relief);
      consoleSpy.mockRestore();
    });
  });

  describe('get', () => {
    it('должен вернуть объект, содержащий текущую сцену', () => {
      const scene = createMockScene({ guid: 'get-scene' });

      gameProcess.scene = scene;
      expect(gameProcess.get()).toEqual({ scene });
    });

    it('должен изначально вернуть сцену равной null', () => {
      expect(gameProcess.get()).toEqual({ scene: null });
    });
  });
});