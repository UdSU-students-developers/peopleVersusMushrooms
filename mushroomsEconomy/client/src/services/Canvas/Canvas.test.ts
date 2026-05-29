import Canvas, { TCanvas } from './Canvas';
import { TWINDOW } from '../../config';

jest.mock('../../config', () => ({
  TWINDOW: {
    LEFT: 0,
    TOP: 0,
    WIDTH: 100,
    HEIGHT: 100,
  },
}));

const defaultWindow: TWINDOW = {
  LEFT: 0,
  TOP: 0,
  WIDTH: 100,
  HEIGHT: 100,
};

describe('Canvas', () => {
  let mockContext: CanvasRenderingContext2D;
  let mockContextV: CanvasRenderingContext2D;
  let parentElement: HTMLDivElement;
  let getContextSpy: jest.SpyInstance;
  let addEventListenerSpy: jest.SpyInstance;
  let mockSetInterval: jest.SpyInstance;
  let mockClearInterval: jest.SpyInstance;
  let getContextCallCount = 0;

  const callbacks = {
    mouseMove: jest.fn(),
    mouseDown: jest.fn(),
    mouseUp: jest.fn(),
    mouseRightClickDown: jest.fn(),
    mouseClick: jest.fn(),
    mouseLeave: jest.fn(),
    mouseWheel: jest.fn(),
    mouseMiddleDown: jest.fn(),
    mouseMiddleUp: jest.fn(),
    keyDown: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getContextCallCount = 0;


    parentElement = document.createElement('div');
    parentElement.id = 'test-parent';
    document.body.appendChild(parentElement);

    jest.spyOn(document, 'getElementById').mockReturnValue(parentElement);

    // Моки контекстов
    mockContext = {
      clearRect: jest.fn(),
      drawImage: jest.fn(),
    } as any;
    mockContextV = {
      fillStyle: '',
      font: '',
      fillRect: jest.fn(),
      drawImage: jest.fn(),
      beginPath: jest.fn(),
      stroke: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      fillText: jest.fn(),
      strokeStyle: '',
      lineWidth: 0,
      fill: jest.fn(),
      ellipse: jest.fn(),
    } as any;


    getContextSpy = jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(function (this: HTMLCanvasElement) {
        getContextCallCount++;
        return getContextCallCount === 1 ? mockContext : mockContextV;
      });


    addEventListenerSpy = jest.spyOn(HTMLCanvasElement.prototype, 'addEventListener');


    jest.useFakeTimers();
    mockSetInterval = jest.spyOn(global, 'setInterval');
    mockClearInterval = jest.spyOn(global, 'clearInterval');

    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
  });

  afterEach(() => {
    // Очистка DOM
    if (parentElement.parentNode) {
      parentElement.parentNode.removeChild(parentElement);
    }
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const createCanvas = (options?: Partial<TCanvas>) => {
    return new Canvas({
      parentId: 'test-parent',
      WINDOW: { ...defaultWindow },
      WIDTH: 800,
      HEIGHT: 600,
      callbacks,
      ...options,
    });
  };

  describe('конструктор', () => {
    it('должен создавать основной и виртуальный холсты с правильными размерами', () => {
      const canvas = createCanvas();
      expect(canvas.canvas.width).toBe(800);
      expect(canvas.canvas.height).toBe(600);
      expect(canvas.canvasV.width).toBe(800);
      expect(canvas.canvasV.height).toBe(600);
    });

    it('должен использовать размеры окна, если WIDTH/HEIGHT не указаны', () => {
      const canvas = new Canvas({
        parentId: 'test-parent',
        WINDOW: defaultWindow,
        callbacks,
      } as any);
      expect(canvas.canvas.width).toBe(1024);
      expect(canvas.canvas.height).toBe(768);
    });

    it('должен добавлять canvas в родительский элемент по id', () => {
      const canvas = createCanvas();
      expect(parentElement.contains(canvas.canvas)).toBe(true);
    });

    it('должен добавлять canvas в body, если parentId не указан', () => {
      const canvas = new Canvas({
        parentId: '',
        WINDOW: defaultWindow,
        callbacks,
      } as any);
      expect(document.body.contains(canvas.canvas)).toBe(true);

      document.body.removeChild(canvas.canvas);
    });

    it('должен регистрировать все обработчики событий', () => {
      createCanvas();
      const events = addEventListenerSpy.mock.calls.map((call: any) => call[0]);
      expect(events).toEqual([
        'mousemove',
        'mousedown',
        'mouseup',
        'click',
        'mouseleave',
        'wheel',
        'contextmenu',
        'keydown',
      ]);
    });

    it('должен запускать интервал для автопрокрутки', () => {
      createCanvas();
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 200);
    });
  });

  describe('деструктор', () => {
    it('должен удалять canvas из родителя и очищать интервал', () => {
      const canvas = createCanvas();
      const intervalId = canvas['interval']; // доступ к приватному полю
      canvas.destructor();
      expect(parentElement.contains(canvas.canvas)).toBe(false);
      expect(mockClearInterval).toHaveBeenCalledWith(intervalId);
    });

    it('должен обнулять ссылки на canvas и контексты', () => {
      const canvas = createCanvas();
      canvas.destructor();
      expect(canvas['contextV']).toBeNull();
      expect(canvas['canvasV']).toBeNull();
      expect(canvas['context']).toBeNull();
      expect(canvas['canvas']).toBeNull();
    });
  });

  describe('преобразования координат', () => {
    let canvas: Canvas;
    beforeEach(() => {
      canvas = createCanvas();
    });

    it('xs должен преобразовывать мировую x в экранную x', () => {
      expect(canvas.xs(50)).toBe(400); // (50-0)*800/100
      expect(canvas.xs(0)).toBe(0);
      expect(canvas.xs(100)).toBe(800);
    });

    it('ys должен преобразовывать мировую y в экранную y', () => {
      expect(canvas.ys(50)).toBe(300);
      expect(canvas.ys(0)).toBe(0);
      expect(canvas.ys(100)).toBe(600);
    });

    it('sx должен преобразовывать экранную x в мировую x', () => {
      expect(canvas.sx(400)).toBe(50);
    });

    it('sy должен преобразовывать экранную y в мировую y', () => {
      expect(canvas.sy(300)).toBe(50);
    });

    it('dec должен преобразовывать мировое расстояние в экранное расстояние', () => {
      expect(canvas.dec(1)).toBe(8);
    });
  });

  describe('методы рисования', () => {
    let canvas: Canvas;

    beforeEach(() => {
      canvas = createCanvas();
      jest.clearAllMocks(); 
    });

    it('clear должен заливать весь виртуальный холст серым цветом', () => {
      canvas.clear();
      expect(mockContextV.fillStyle).toBe('rgb(116, 116, 116)');
      expect(mockContextV.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('clearImage должен рисовать изображение на весь виртуальный холст', () => {
      const img = new Image();
      canvas.clearImage(img);
      expect(mockContextV.drawImage).toHaveBeenCalledWith(img, 0, 0, 800, 600);
    });

    it('line должен рисовать линию на виртуальном холсте', () => {
      canvas.line(10, 20, 30, 40, '#0f0', 2);
      expect(mockContextV.beginPath).toHaveBeenCalled();
      expect(mockContextV.strokeStyle).toBe('#0f0');
      expect(mockContextV.lineWidth).toBe(2);
      expect(mockContextV.moveTo).toHaveBeenCalledWith(80, 120);
      expect(mockContextV.lineTo).toHaveBeenCalledWith(240, 240);
      expect(mockContextV.stroke).toHaveBeenCalled();
      expect(mockContextV.closePath).toHaveBeenCalled();
    });

    it('text должен рисовать текст на виртуальном холсте', () => {
      canvas.text(15, 25, 'Hello', '#fff', 'bold 1rem Arial');
      expect(mockContextV.fillStyle).toBe('#fff');
      expect(mockContextV.font).toBe('bold 1rem Arial');
      expect(mockContextV.fillText).toHaveBeenCalledWith('Hello', 120, 150);
    });

    it('drawFPS должен рисовать текст FPS в фиксированной позиции', () => {
      canvas.drawFPS('60 FPS', 'rgb(149, 255, 50)', 'bold 1rem Arial');
      expect(mockContextV.fillStyle).toBe('rgb(149, 255, 50)');
      expect(mockContextV.font).toBe('bold 1rem Arial');
      expect(mockContextV.fillText).toHaveBeenCalledWith('60 FPS', 12, 36);
    });

    it('rect должен рисовать залитый прямоугольник', () => {
      canvas.rect(20, 30, 64, 'rgba(255, 0, 0, 1)');
      expect(mockContextV.fillStyle).toBe('rgba(255, 0, 0, 1)');
      expect(mockContextV.fillRect).toHaveBeenCalledWith(160, 180, 64, 64);
    });

    it('rectangle должен рисовать залитый прямоугольник с произвольными размерами', () => {
      canvas.rectangle(10, 20, 200, 150, '#f004');
      expect(mockContextV.fillStyle).toBe('#f004');
      expect(mockContextV.fillRect).toHaveBeenCalledWith(80, 120, 200, 150);
    });

    it('spriteFull должен рисовать часть изображения', () => {
      const img = new Image();
      canvas.spriteFull(img, 5, 5, 32, 64, 16);
      expect(mockContextV.drawImage).toHaveBeenCalledWith(img, 32, 64, 16, 16, 40, 30, 8, 8);
    });

    it('oval должен рисовать эллипс', () => {
      canvas.oval(10, 20, 30, 40, 'blue', 2, 'red');
      const centerX = 80 + 240 / 2; // 200
      const centerY = 120 + 240 / 2; // 240
      expect(mockContextV.beginPath).toHaveBeenCalled();
      expect(mockContextV.ellipse).toHaveBeenCalledWith(200, 240, 120, 120, 0, 0, 2 * Math.PI);
      expect(mockContextV.fillStyle).toBe('blue');
      expect(mockContextV.fill).toHaveBeenCalled();
      expect(mockContextV.lineWidth).toBe(2);
      expect(mockContextV.strokeStyle).toBe('red');
      expect(mockContextV.stroke).toHaveBeenCalled();
      expect(mockContextV.closePath).toHaveBeenCalled();
    });

    it('render должен копировать виртуальный холст на основной холст', () => {
      canvas.render();
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(mockContext.drawImage).toHaveBeenCalledWith(canvas.canvasV, 0, 0);
    });
  });

  describe('обработчики событий', () => {
    let canvas: Canvas;
    const createMouseEvent = (overrides = {}) =>
      ({
        preventDefault: jest.fn(),
        offsetX: 100,
        offsetY: 200,
        button: 0,
        deltaY: 0,
        ...overrides,
      } as any);

    beforeEach(() => {
      canvas = createCanvas();
      jest.clearAllMocks();
    });

    it('mouseDown с левой кнопкой (0) должен вызывать mouseDown с мировыми координатами', () => {
      const event = createMouseEvent({ button: 0, offsetX: 80, offsetY: 120 });
      canvas['mouseDownHandler'](event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(callbacks.mouseDown).toHaveBeenCalledWith(10, 20);
    });

    it('mouseDown со средней кнопкой (1) должен устанавливать isMiddleMouseDown и вызывать опциональный callback', () => {
      const event = createMouseEvent({ button: 1, offsetX: 160, offsetY: 240 });
      canvas['mouseDownHandler'](event);
      expect(canvas.isMiddleMouseDown).toBe(true);
      expect(callbacks.mouseMiddleDown).toHaveBeenCalledWith(20, 40, 160, 240);
    });

    it('mouseUp с левой кнопкой должен вызывать mouseUp', () => {
      const event = createMouseEvent({ button: 0, offsetX: 80, offsetY: 120 });
      canvas['mouseUpHandler'](event);
      expect(callbacks.mouseUp).toHaveBeenCalledWith(10, 20);
    });

    it('mouseUp со средней кнопкой должен сбрасывать isMiddleMouseDown и вызывать опциональный callback', () => {
      canvas.isMiddleMouseDown = true;
      const event = createMouseEvent({ button: 1, offsetX: 160, offsetY: 240 });
      canvas['mouseUpHandler'](event);
      expect(canvas.isMiddleMouseDown).toBe(false);
      expect(callbacks.mouseMiddleUp).toHaveBeenCalledWith(20, 40);
    });

    it('mouseRightClickDown с кнопкой 2 должен вызывать callback', () => {
      const event = createMouseEvent({ button: 2, offsetX: 200, offsetY: 300 });
      canvas['mouseRightClickDownHandler'](event);
      expect(callbacks.mouseRightClickDown).toHaveBeenCalledWith(25, 50);
    });

    it('mouseClick должен вызывать callback клика для левой кнопки', () => {
      const event = createMouseEvent({ button: 0, offsetX: 400, offsetY: 300 });
      canvas['mouseClickHandler'](event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(callbacks.mouseClick).toHaveBeenCalledWith(50, 50);
    });

    it('mouseMove должен вызывать callback с экранными и мировыми координатами', () => {
      const event = createMouseEvent({ offsetX: 320, offsetY: 180 });
      canvas['mouseMoveHandler'](event);
      expect(callbacks.mouseMove).toHaveBeenCalledWith(40, 30, 320, 180);
    });

    it('mouseLeave должен сбрасывать dx/dy и вызывать опциональный callback ухода', () => {
      canvas.dx = 5;
      canvas.dy = -5;
      canvas['mouseLeaveHandler']();
      expect(canvas.dx).toBe(0);
      expect(canvas.dy).toBe(0);
      expect(callbacks.mouseLeave).toHaveBeenCalled();
    });

    it('mouseWheel должен вызывать callback с дельтой и мировыми координатами', () => {
      const event = createMouseEvent({ offsetX: 160, offsetY: 120, deltaY: 120 });
      canvas['mouseWheelHandler'](event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(callbacks.mouseWheel).toHaveBeenCalledWith(120, 20, 20);
    });

    it('keyDown с Escape должен вызывать callback keyDown', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      canvas['keyDownHandler'](event);
      expect(callbacks.keyDown).toHaveBeenCalledWith(event);
    });

    it('keyDown с другими клавишами не должен вызывать callback', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      canvas['keyDownHandler'](event);
      expect(callbacks.keyDown).not.toHaveBeenCalled();
    });

    it('не должен выбрасывать ошибку, если опциональные callbacks отсутствуют', () => {
      const canvasNoOpt = new Canvas({
        parentId: 'test-parent',
        WINDOW: defaultWindow,
        callbacks: {
          mouseMove: jest.fn(),
          mouseDown: jest.fn(),
          mouseUp: jest.fn(),
          mouseRightClickDown: jest.fn(),
          mouseClick: jest.fn(),
        },
      } as any);
      const wheelEvent = createMouseEvent({ deltaY: 10 });
      expect(() => canvasNoOpt['mouseWheelHandler'](wheelEvent)).not.toThrow();
      const middleDownEvent = createMouseEvent({ button: 1 });
      expect(() => canvasNoOpt['mouseDownHandler'](middleDownEvent)).not.toThrow();
      expect(() => canvasNoOpt['mouseLeaveHandler']()).not.toThrow();
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      expect(() => canvasNoOpt['keyDownHandler'](escapeEvent)).not.toThrow();
    });
  });

  describe('интервал автопрокрутки', () => {
    it('должен обновлять WINDOW.LEFT и TOP, когда dx или dy не равны нулю', () => {
      const canvas = createCanvas();
      canvas.dx = 10;
      canvas.dy = -5;
      jest.advanceTimersByTime(200);
      expect(canvas.WINDOW.LEFT).toBe(10);
      expect(canvas.WINDOW.TOP).toBe(-5);
      jest.advanceTimersByTime(200);
      expect(canvas.WINDOW.LEFT).toBe(20);
      expect(canvas.WINDOW.TOP).toBe(-10);
    });

    it('не должен обновлять WINDOW, когда dx и dy равны нулю', () => {
      const canvas = createCanvas();
      const initialLeft = canvas.WINDOW.LEFT;
      const initialTop = canvas.WINDOW.TOP;
      canvas.dx = 0;
      canvas.dy = 0;
      jest.advanceTimersByTime(200);
      expect(canvas.WINDOW.LEFT).toBe(initialLeft);
      expect(canvas.WINDOW.TOP).toBe(initialTop);
    });
  });
});