const handler = require('./useGetReliefHandler');

describe('Обработчик получения рельефа', () => {
    let mediator, answer, req, res, hand;

    beforeEach(() => {
        answer = {
            good: jest.fn().mockReturnValue('хорошо'),
            bad: jest.fn().mockReturnValue('плохо')
        }

        mediator = {
            getTriggerTypes: jest.fn(() => ({ GET_RELIEF_HANDLER: 'триггер рельефа' })),
            get: jest.fn(),
        };

        req = { body: {} }
        res = { send: jest.fn() };

        hand = handler(mediator, answer);
    })

    test('Если рельеф передан, вызываем медиатор и отдаем good', () => {
        const relief = [
            [0, 1, 2],
            [0, 0, 1],
            [2, 1, 0]
        ];

        req.body = {
            mapGuid: '1234',
            userGuid: '4321'
        };

        hand(req, res);
        expect(mediator.getTriggerTypes).toHaveBeenCalled();
        expect(mediator.get).toHaveBeenCalledWith('триггер-рельефа', { mapGuid: '1234', userGuid: '4321' });
        expect(res.send).toHaveBeenCalledWith('хорошо');
    })

    test('Если mapGuid не передан, возвращаем bad', () => {
        req.body = {
            userGuid: '4321'
        };

        hand(req, res);
        expect(mediator.getTriggerTypes).not.toHaveBeenCalled();
        expect(mediator.get).not.toHaveBeenCalled();
        expect(answer.bad).toHaveBeenCalledWith(3002);
        expect(res.send).toHaveBeenCalledWith('плохо');
    })

    test('Если userGuid не передан, возвращаем bad', () => {
        req.body = {
            mapGuid: '1234'
        };

        hand(req, res);
        expect(mediator.getTriggerTypes).not.toHaveBeenCalled();
        expect(mediator.get).not.toHaveBeenCalled();
        expect(answer.bad).toHaveBeenCalledWith(3002);
        expect(res.send).toHaveBeenCalledWith('плохо');
    })
})