import Mediator from './Mediator';

describe('Медиатор', () => {
  const EVENTS = {
    LOGIN: 'login',
    LOGOUT: 'logout',
    ERROR: 'error',
  };
  const TRIGGERS = {
    GET_USER: 'getUser',
    CALCULATE: 'calculate',
  };

  let mediator: Mediator;

  beforeEach(() => {
    mediator = new Mediator({ EVENTS, TRIGGERS });
  });

  describe('конструктор', () => {
    it('должен инициализироваться с заданными EVENTS и TRIGGERS', () => {
      expect(mediator.getEventTypes()).toEqual(EVENTS);
      expect(mediator.getTriggerTypes()).toEqual(TRIGGERS);
    });

    it('должен иметь пустые массивы событий и триггеры, возвращающие null', () => {
      expect(() => mediator.call(EVENTS.LOGIN, { user: 'test' })).not.toThrow();
      expect(mediator.get(TRIGGERS.GET_USER)).toBeNull();
    });
  });

  describe('события', () => {
    describe('подписка и вызов', () => {
      it('должен подписать функцию и вызвать её с данными', () => {
        const mock = jest.fn();
        const handler = (data: any) => mock(data);
        mediator.subscribe(EVENTS.LOGIN, handler);
        mediator.call(EVENTS.LOGIN, { user: 'John' });
        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock).toHaveBeenCalledWith({ user: 'John' });
      });

      it('должен вызывать несколько подписанных обработчиков', () => {
        const mock1 = jest.fn();
        const mock2 = jest.fn();
        const handler1 = (data?: any) => mock1(data);
        const handler2 = (data?: any) => mock2(data);
        mediator.subscribe(EVENTS.LOGOUT, handler1);
        mediator.subscribe(EVENTS.LOGOUT, handler2);
        mediator.call(EVENTS.LOGOUT);
        expect(mock1).toHaveBeenCalledTimes(1);
        expect(mock2).toHaveBeenCalledTimes(1);
      });

      it('не должен выбрасывать ошибку, если имя события не существует', () => {
        expect(() => mediator.call('nonexistent')).not.toThrow();
      });

      it('должен игнорировать подписки, не являющиеся функциями', () => {
        mediator.subscribe(EVENTS.ERROR, 'not a function' as any);
        mediator.subscribe(EVENTS.ERROR, undefined as any);
        expect(() => mediator.call(EVENTS.ERROR, 'error data')).not.toThrow();
      });

      it('должен разрешать множественные подписки одной и той же функции', () => {
        const mock = jest.fn();
        const handler = (data?: any) => mock(data);
        mediator.subscribe(EVENTS.LOGIN, handler);
        mediator.subscribe(EVENTS.LOGIN, handler);
        mediator.call(EVENTS.LOGIN);
        expect(mock).toHaveBeenCalledTimes(2);
      });
    });

    describe('отписка', () => {
      it('должен удалять конкретный обработчик', () => {
        const mock1 = jest.fn();
        const mock2 = jest.fn();
        const handler1 = (data?: any) => mock1(data);
        const handler2 = (data?: any) => mock2(data);
        mediator.subscribe(EVENTS.LOGIN, handler1);
        mediator.subscribe(EVENTS.LOGIN, handler2);
        mediator.unsubscribe(EVENTS.LOGIN, handler1);
        mediator.call(EVENTS.LOGIN);
        expect(mock1).not.toHaveBeenCalled();
        expect(mock2).toHaveBeenCalledTimes(1);
      });

      it('должен удалять только первое вхождение, если функция подписана несколько раз', () => {
        const mock = jest.fn();
        const handler = (data?: any) => mock(data);
        mediator.subscribe(EVENTS.LOGIN, handler);
        mediator.subscribe(EVENTS.LOGIN, handler);
        mediator.unsubscribe(EVENTS.LOGIN, handler);
        mediator.call(EVENTS.LOGIN);
        expect(mock).toHaveBeenCalledTimes(1);
      });

      it('не должен выбрасывать ошибку, если обработчик не найден', () => {
        const mock = jest.fn();
        const handler = (data?: any) => mock(data);
        mediator.subscribe(EVENTS.LOGIN, handler);
        const anotherHandler = (data?: any) => jest.fn()(data); // функция, которой нет в списке
        expect(() => mediator.unsubscribe(EVENTS.LOGIN, anotherHandler)).not.toThrow();
        mediator.call(EVENTS.LOGIN);
        expect(mock).toHaveBeenCalledTimes(1);
      });

      it('не должен ничего делать, если имя события не существует', () => {
        const fn = (data?: any) => {};
        expect(() => mediator.unsubscribe('nonexistent', fn)).not.toThrow();
      });

      it('должен игнорировать аргументы, не являющиеся функциями', () => {
        const mock = jest.fn();
        const handler = (data?: any) => mock(data);
        mediator.subscribe(EVENTS.LOGIN, handler);
        mediator.unsubscribe(EVENTS.LOGIN, 'string' as any);
        mediator.call(EVENTS.LOGIN);
        expect(mock).toHaveBeenCalledTimes(1);
      });
    });

    describe('отписка от всех', () => {
      it('должен удалять все обработчики для заданного события', () => {
        const mock1 = jest.fn();
        const mock2 = jest.fn();
        const handler1 = (data?: any) => mock1(data);
        const handler2 = (data?: any) => mock2(data);
        mediator.subscribe(EVENTS.LOGIN, handler1);
        mediator.subscribe(EVENTS.LOGIN, handler2);
        mediator.unsubscribeAll(EVENTS.LOGIN);
        mediator.call(EVENTS.LOGIN);
        expect(mock1).not.toHaveBeenCalled();
        expect(mock2).not.toHaveBeenCalled();
      });

      it('не должен ничего делать, если имя события не существует', () => {
        expect(() => mediator.unsubscribeAll('nonexistent')).not.toThrow();
      });
    });
  });

  describe('триггеры', () => {
    describe('установка и получение', () => {
      it('должен устанавливать функцию-триггер и получать её результат', () => {
        const mock = jest.fn((data: { num: number }) => data.num * 2);
        const triggerFn = (data: any) => mock(data);
        mediator.set(TRIGGERS.CALCULATE, triggerFn);
        const result = mediator.get<number>(TRIGGERS.CALCULATE, { num: 5 });
        expect(mock).toHaveBeenCalledWith({ num: 5 });
        expect(result).toBe(10);
      });

      it('должен возвращать null, если триггер не установлен', () => {
        expect(mediator.get(TRIGGERS.GET_USER)).toBeNull();
      });

      it('должен игнорировать значения, не являющиеся функциями', () => {
        mediator.set(TRIGGERS.GET_USER, 'not a function' as any);
        expect(mediator.get(TRIGGERS.GET_USER)).toBeNull();
      });

      it('должен возвращать то, что возвращает триггер (включая ложные значения)', () => {
        mediator.set(TRIGGERS.GET_USER, () => null);
        expect(mediator.get(TRIGGERS.GET_USER)).toBeNull();
        mediator.set(TRIGGERS.GET_USER, () => 0);
        expect(mediator.get(TRIGGERS.GET_USER)).toBe(0);
      });
    });
  });
});