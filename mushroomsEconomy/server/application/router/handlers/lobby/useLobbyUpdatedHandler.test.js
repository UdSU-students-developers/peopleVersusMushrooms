// предположим, файл называется обработчик.js
const handler = require('./useLobbyUpdatedHandler');

describe('обработчик лобби', () => {
  let mediator, answer, req, res, обработчик;

  beforeEach(() => {
    // Мокаем answer
    answer = {
      good: jest.fn().mockReturnValue('хорошо'),
      bad: jest.fn().mockReturnValue('плохо'),
    };

    // Мокаем mediator
    mediator = {
      getEventTypes: jest.fn(() => ({ LOBBY_UPDATED: 'событие_лобби' })),
      call: jest.fn(),
    };

    // Мокаем запрос и ответ
    req = { body: {} };
    res = { send: jest.fn() };

    обработчик = handler(mediator, answer);
  });

  test('если лобби есть, вызываем медиатор и отдаём good', () => {
    req.body.lobbies = ['комната1', 'комната2'];
    обработчик(req, res);

    expect(mediator.getEventTypes).toHaveBeenCalled();
    expect(mediator.call).toHaveBeenCalledWith('событие_лобби', ['комната1', 'комната2']);
    expect(answer.good).toHaveBeenCalledWith(true);
    expect(res.send).toHaveBeenCalledWith('хорошо');
  });

  test('если лобби нет, сразу отдаём bad', () => {
    обработчик(req, res);

    expect(mediator.getEventTypes).not.toHaveBeenCalled();
    expect(mediator.call).not.toHaveBeenCalled();
    expect(answer.bad).toHaveBeenCalledWith(1004);
    expect(res.send).toHaveBeenCalledWith('плохо');
  });
});