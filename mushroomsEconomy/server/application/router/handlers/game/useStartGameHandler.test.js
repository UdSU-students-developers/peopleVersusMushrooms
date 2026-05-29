const createHandler = require('./useStartGameHandler');

describe('Game start handler', () => {
  let mediator, answer, req, res;

  beforeEach(() => {
    mediator = {
      getEventTypes: jest.fn().mockReturnValue({ START_GAME: 'START_GAME' }),
      call: jest.fn(),
    };

    answer = {
      good: jest.fn((data) => ({ status: 'good', data })),
      bad: jest.fn((error) => ({ status: 'bad', error })),
    };

    req = {
      body: {
        spectator: 'spec-123',
        peopleArmy: 'army-1',
        peopleEconomy: 'eco-1',
        mushroomsArmy: 'mush-army-1',
        mushroomsEconomy: 'mush-eco-1',
        mapGuid: 'map-1',
      },
    };

    res = {
      send: jest.fn(),
    };

    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('должен вызвать mediator.call с правильным типом события и объектом guids', () => {
    const handler = createHandler(mediator, answer);
    handler(req, res);

    expect(mediator.getEventTypes).toHaveBeenCalledTimes(1);
    expect(mediator.call).toHaveBeenCalledWith('START_GAME', {
      guids: {
        spectator: 'spec-123',
        peopleArmy: 'army-1',
        peopleEconomy: 'eco-1',
        mushroomsArmy: 'mush-army-1',
        mushroomsEconomy: 'mush-eco-1',
        mapGuid: 'map-1',
      },
    });
  });

  it('должен отправить успешный ответ, если mediator.call вернул answer.good', () => {
    const responseFromMediator = { result: 'ok', data: { gameId: 42, status: 'started' } };
    mediator.call.mockReturnValue(responseFromMediator);

    const handler = createHandler(mediator, answer);
    handler(req, res);

    expect(res.send).toHaveBeenCalledWith(responseFromMediator);
    expect(answer.good).not.toHaveBeenCalled();
    expect(answer.bad).not.toHaveBeenCalled();
  });

  it('должен отправить ответ с ошибкой, если mediator.call вернул answer.bad', () => {
    const errorResponse = {
      result: 'error',
      error: { code: 4001, message: 'экономики с таким гуидом нету' },
    };
    mediator.call.mockReturnValue(errorResponse);

    const handler = createHandler(mediator, answer);
    handler(req, res);

    expect(res.send).toHaveBeenCalledWith(errorResponse);
    expect(answer.good).not.toHaveBeenCalled();
    expect(answer.bad).not.toHaveBeenCalled();
  });

  it('должен вернуть 9000, когда ответ от mediator равен undefined', () => {
    mediator.call.mockReturnValue(undefined);

    const handler = createHandler(mediator, answer);
    handler(req, res);

    expect(answer.bad).toHaveBeenCalledWith(9000);
    expect(res.send).toHaveBeenCalledWith(answer.bad(9000));
    expect(answer.good).not.toHaveBeenCalled();
  });

  it('должен логировать объект guids в консоль', () => {
    const handler = createHandler(mediator, answer);
    handler(req, res);

    expect(console.log).toHaveBeenCalledWith({
      spectator: 'spec-123',
      peopleArmy: 'army-1',
      peopleEconomy: 'eco-1',
      mushroomsArmy: 'mush-army-1',
      mushroomsEconomy: 'mush-eco-1',
      mapGuid: 'map-1',
    });
  });
});