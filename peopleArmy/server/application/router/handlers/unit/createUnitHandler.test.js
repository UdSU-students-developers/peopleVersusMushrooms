const createUnitHandler = require('./createUnitHandler');
const Answer = require('../../../Answer');

const CREATE_UNIT_TRIGGER = 'CREATE_UNIT';

const createMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const createMockMediator = (getResult) => ({
    TRIGGERS: { CREATE_UNIT: CREATE_UNIT_TRIGGER },
    get: jest.fn().mockReturnValue(getResult),
});

describe('createUnitHandler', () => {
    let mediator;
    let answer;
    let handler;
    let req;
    let res;
    let consoleLogSpy;

    beforeEach(() => {
        answer = new Answer();
        mediator = createMockMediator({ result: 'ok', data: { unitGuid: 'u-1' } });
        handler = createUnitHandler(mediator, answer);
        req = { body: { guid: 'player-1', x: 10, y: 20, type: 'soldier' } };
        res = createMockRes();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    test('фабрика возвращает функцию-обработчик с сигнатурой (req, res)', () => {
        expect(createUnitHandler).toBeDefined();
        expect(typeof createUnitHandler).toBe('function');
        expect(typeof handler).toBe('function');
        expect(handler.length).toBe(2);
        expect(handler).toBeInstanceOf(Function);
    });

    test('при успехе вызывает mediator.get с триггером CREATE_UNIT и полями из req.body', () => {
        handler(req, res);

        expect(mediator.get).toHaveBeenCalled();
        expect(mediator.get).toHaveBeenCalledTimes(1);
        expect(mediator.get).toHaveBeenCalledWith(CREATE_UNIT_TRIGGER, {
            guid: 'player-1',
            x: 10,
            y: 20,
            type: 'soldier',
        });
        expect(mediator.get.mock.calls[0][0]).toBe(CREATE_UNIT_TRIGGER);
        expect(mediator.get.mock.calls[0][1]).toEqual({
            guid: 'player-1',
            x: 10,
            y: 20,
            type: 'soldier',
        });
    });

    test('при успешном результате отвечает JSON без HTTP 400', () => {
        const successPayload = { result: 'ok', data: { unitGuid: 'u-42', x: 10, y: 20 } };
        mediator.get.mockReturnValue(successPayload);

        handler(req, res);

        expect(res.json).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledWith(successPayload);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json.mock.calls[0][0].result).toBe('ok');
    });

    test('при result.result === "error" возвращает статус 400 и тело ошибки', () => {
        const errorPayload = new Answer().bad(400);
        mediator.get.mockReturnValue(errorPayload);

        handler(req, res);

        expect(res.status).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(errorPayload);
        expect(res.json.mock.calls[0][0]).toEqual(errorPayload);
    });

    test('при ошибке сначала вызывается status(400), затем json (цепочка)', () => {
        mediator.get.mockReturnValue({ result: 'error', code: 11, error: 'Ошибка авторизации' });

        handler(req, res);

        const statusOrder = res.status.mock.invocationCallOrder[0];
        const jsonOrder = res.json.mock.invocationCallOrder[0];

        expect(statusOrder).toBeLessThan(jsonOrder);
        expect(res.status.mock.results[0].value).toBe(res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledTimes(1);
        expect(res.json.mock.calls[0][0].result).toBe('error');
    });

    test('если mediator вернул falsy, отвечает answer.bad(9000)', () => {
        mediator.get.mockReturnValue(null);

        handler(req, res);

        const expected = answer.bad(9000);

        expect(res.json).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expected);
        expect(res.json.mock.calls[0][0].code).toBe(9000);
        expect(res.json.mock.calls[0][0].result).toBe('error');
        expect(res.status).not.toHaveBeenCalled();
    });

    test('корректно обрабатывает отсутствующий или пустой req.body', () => {
        const bodies = [undefined, null, {}];

        for (const body of bodies) {
            const localMediator = createMockMediator({ result: 'ok', data: {} });
            const localHandler = createUnitHandler(localMediator, answer);
            const localRes = createMockRes();
            const localReq = { body };

            localHandler(localReq, localRes);

            expect(localMediator.get).toHaveBeenCalledWith(CREATE_UNIT_TRIGGER, {
                guid: undefined,
                x: undefined,
                y: undefined,
                type: undefined,
            });
            expect(localRes.json).toHaveBeenCalledTimes(1);
            expect(localRes.status).not.toHaveBeenCalled();
            expect(localMediator.get).toHaveBeenCalledTimes(1);
            expect(localRes.json.mock.calls[0][0].result).toBe('ok');
        }
    });

    test('при ошибке возвращает res из цепочки status().json() и пишет в консоль', () => {
        const errorPayload = { result: 'error', code: 422, error: 'Юнит с таким идентификатором уже существует' };
        mediator.get.mockReturnValue(errorPayload);

        const returnValue = handler(req, res);

        expect(returnValue).toBe(res);
        expect(consoleLogSpy).toHaveBeenCalled();
        expect(consoleLogSpy.mock.calls[0][0]).toBe('CREATE_UNIT error:');
        expect(consoleLogSpy.mock.calls[0][1]).toEqual(errorPayload);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(errorPayload);
    });
});
