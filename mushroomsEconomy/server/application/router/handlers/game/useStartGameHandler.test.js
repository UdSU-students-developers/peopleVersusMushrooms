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

  it('должен отправить успешный ответ, если mediator.call вернул объект без ошибки', () => {
    const responseFromMediator = { gameId: 42, status: 'started' };
    mediator.call.mockReturnValue(responseFromMediator);

    const handler = createHandler(mediator, answer);
    handler(req, res);

    expect(answer.good).toHaveBeenCalledWith(responseFromMediator);
    expect(res.send).toHaveBeenCalledWith(answer.good(responseFromMediator));
    expect(answer.bad).not.toHaveBeenCalled();
  });

  it('должен отправить ответ с ошибкой, если mediator.call вернул объект с error', () => {
    const errorResponse = { error: 'Not enough players' };
    mediator.call.mockReturnValue(errorResponse);

    const handler = createHandler(mediator, answer);
    handler(req, res);

    expect(answer.bad).toHaveBeenCalledWith('Not enough players');
    expect(res.send).toHaveBeenCalledWith(answer.bad('Not enough players'));
    expect(answer.good).not.toHaveBeenCalled();
  });

  it('должен корректно обрабатывать ситуацию, когда ответ от mediator равен undefined', () => {
    mediator.call.mockReturnValue(undefined);

    const handler = createHandler(mediator, answer);
    handler(req, res);

    expect(answer.good).toHaveBeenCalledWith(undefined);
    expect(res.send).toHaveBeenCalledWith(answer.good(undefined));
    expect(answer.bad).not.toHaveBeenCalled();
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