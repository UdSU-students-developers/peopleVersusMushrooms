import useCanvas from './useCanvas';
import Canvas from './Canvas';
import { TCanvas } from './Canvas';

jest.mock('./Canvas', () => {
  return jest.fn().mockImplementation((params: TCanvas) => ({
    ...params,
    canvas: {} as HTMLCanvasElement,
    context: {} as CanvasRenderingContext2D,
    canvasV: {} as HTMLCanvasElement,
    contextV: {} as CanvasRenderingContext2D,
    WIDTH: params.WIDTH || 800,
    HEIGHT: params.HEIGHT || 600,
    WINDOW: params.WINDOW,
    callbacks: params.callbacks,
    destructor: jest.fn(),
    clear: jest.fn(),
    render: jest.fn(),
  }));
});

const removeRAFMethods = () => {
  delete (window as any).requestAnimationFrame;
  delete (window as any).webkitRequestAnimationFrame;
  delete (window as any).mozRequestAnimationFrame;
  delete (window as any).oRequestAnimationFrame;
  delete (window as any).msRequestAnimationFrame;
  delete (window as any).requestAnimFrame;
};

const mockRAF = (fn = jest.fn()) => {
  window.requestAnimationFrame = fn;
};

describe('useCanvas', () => {
  let mockRender: jest.Mock;
  let mockSetTimeout: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    mockRender = jest.fn();
    mockSetTimeout = jest.spyOn(window, 'setTimeout');
    jest.clearAllMocks();

    removeRAFMethods();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('window.requestAnimFrame', () => {
    it('должен быть определён как функция после вызова useCanvas', () => {
      useCanvas(mockRender);
      expect(window.requestAnimFrame).toEqual(expect.any(Function));
    });

    it('должен использовать window.requestAnimationFrame, если он доступен', () => {
      const rafMock = jest.fn();
      window.requestAnimationFrame = rafMock;

      useCanvas(mockRender);
      expect(window.requestAnimFrame).toBe(rafMock);
    });

    it('должен использовать setTimeout как запасной вариант, если нет методов rAF', () => {
      useCanvas(mockRender);
      const fallback = window.requestAnimFrame;

      const callback = jest.fn();
      fallback(callback);
      expect(mockSetTimeout).toHaveBeenCalledWith(callback, 1000 / 60);
    });
  });

  describe('возвращаемая фабричная функция', () => {
    it('должна немедленно создать Canvas и запустить цикл анимации через 300 мс', () => {
      const createCanvas = useCanvas(mockRender);
      const params: TCanvas = {
        parentId: 'test',
        WINDOW: { LEFT: 0, TOP: 0, WIDTH: 100, HEIGHT: 100 },
        WIDTH: 800,
        HEIGHT: 600,
        callbacks: {} as any,
      };

      const canvasInstance = createCanvas(params);
      expect(Canvas).toHaveBeenCalledWith(params);
      expect(canvasInstance).toBeDefined();

      expect(mockRender).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);
      expect(mockRender).toHaveBeenCalledWith(0);
    });

    it('должна немедленно запустить цикл анимации через 300 мс', () => {
      const createCanvas = useCanvas(mockRender);
      createCanvas({} as TCanvas);
      jest.advanceTimersByTime(300);

      expect(mockRender).toHaveBeenCalledWith(0);
    });
  });

  describe('расчёт FPS', () => {
    let nowMock: jest.SpyInstance;

    beforeEach(() => {
      nowMock = jest.spyOn(Date, 'now');
    });

    afterEach(() => {
      nowMock.mockRestore();
    });

    it('должен правильно рассчитывать FPS на протяжении нескольких кадров', () => {
      nowMock.mockReturnValueOnce(1000);
      nowMock.mockReturnValueOnce(1000); 
      nowMock.mockReturnValueOnce(2000); 
      nowMock.mockReturnValueOnce(3000); 

      const createCanvas = useCanvas(mockRender);
      createCanvas({} as TCanvas);

      jest.advanceTimersByTime(300);
      expect(mockRender).toHaveBeenLastCalledWith(0);
      jest.advanceTimersByTime(16);
      expect(mockRender).toHaveBeenLastCalledWith(2);
      jest.advanceTimersByTime(16);
      expect(mockRender).toHaveBeenLastCalledWith(1);
    });

    it('должен сбрасывать счётчик FPS после каждой секунды', () => {
      nowMock.mockReturnValueOnce(5000);
      nowMock.mockReturnValueOnce(5000); 
      nowMock.mockReturnValueOnce(6000); 
      nowMock.mockReturnValueOnce(6000);
      nowMock.mockReturnValueOnce(7000); 

      const createCanvas = useCanvas(mockRender);
      createCanvas({} as TCanvas);
      jest.advanceTimersByTime(300);
      expect(mockRender).toHaveBeenLastCalledWith(0); 

      jest.advanceTimersByTime(16);
      expect(mockRender).toHaveBeenLastCalledWith(2); 

      jest.advanceTimersByTime(16);
      expect(mockRender).toHaveBeenLastCalledWith(2); 

      jest.advanceTimersByTime(16);
      expect(mockRender).toHaveBeenLastCalledWith(2);
    });
  });

  describe('цикл анимации', () => {
    it('должен многократно вызывать render через window.requestAnimFrame', () => {
      const createCanvas = useCanvas(mockRender);
      createCanvas({} as TCanvas);
      jest.advanceTimersByTime(300);

      expect(mockRender).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(32); 
      expect(mockRender.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    it('должен продолжать работу после множества интервалов', () => {
      const createCanvas = useCanvas(mockRender);
      createCanvas({} as TCanvas);
      jest.advanceTimersByTime(300 + 16 * 10); 
      expect(mockRender.mock.calls.length).toBeGreaterThanOrEqual(10);
    });
  });
});