const notFoundHandler = require('./notFoundHandler');
const Answer = require('../../Answer');

const createMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('notFoundHandler', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {};
        res = createMockRes();
    });

    test('должен быть функцией и принимать ровно 2 аргумента (req, res)', () => {
        expect(notFoundHandler).toBeDefined();
        expect(typeof notFoundHandler).toBe('function');
        expect(notFoundHandler.length).toBe(2);
        expect(notFoundHandler).not.toBeNull();
        expect(notFoundHandler).toBeInstanceOf(Function);
    });

    test('должен устанавливать HTTP-статус 404', () => {
        notFoundHandler(req, res);

        expect(res.status).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.status.mock.calls[0][0]).toBe(404);
        expect(typeof res.status.mock.calls[0][0]).toBe('number');
    });

    test('должен отправлять JSON с корректной структурой ошибки', () => {
        notFoundHandler(req, res);

        expect(res.json).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledTimes(1);

        const payload = res.json.mock.calls[0][0];
        expect(payload).toBeDefined();
        expect(payload).toHaveProperty('result', 'error');
        expect(payload).toHaveProperty('code', 404);
        expect(payload).toHaveProperty('error');
        expect(typeof payload.error).toBe('string');
    });

    test('тело ответа должно совпадать с результатом Answer.bad(404)', () => {
        notFoundHandler(req, res);

        const expected = new Answer().bad(404);
        const payload = res.json.mock.calls[0][0];

        expect(payload).toEqual(expected);
        expect(payload.result).toBe('error');
        expect(payload.code).toBe(404);
        expect(payload.error).toBe('Не найдено');
        expect(Object.keys(payload).sort()).toEqual(['code', 'error', 'result']);
    });

    test('должен вызывать status до json (через цепочку вызовов)', () => {
        notFoundHandler(req, res);

        const statusOrder = res.status.mock.invocationCallOrder[0];
        const jsonOrder = res.json.mock.invocationCallOrder[0];

        expect(statusOrder).toBeLessThan(jsonOrder);
        expect(res.status).toHaveBeenCalledBefore
            ? expect(res.status).toHaveBeenCalledBefore(res.json)
            : expect(statusOrder).toBeLessThan(jsonOrder);
        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledTimes(1);
        expect(res.status.mock.results[0].value).toBe(res);
    });

    test('должен корректно работать вне зависимости от объекта req', () => {
        const variants = [
            {},
            { url: '/unknown/path' },
            { method: 'GET', originalUrl: '/api/none' },
            null,
            undefined,
        ];

        for (const variant of variants) {
            const localRes = createMockRes();
            notFoundHandler(variant, localRes);

            expect(localRes.status).toHaveBeenCalledWith(404);
            expect(localRes.json).toHaveBeenCalledTimes(1);
            expect(localRes.json.mock.calls[0][0].code).toBe(404);
            expect(localRes.json.mock.calls[0][0].result).toBe('error');
            expect(localRes.json.mock.calls[0][0].error).toBe('Не найдено');
        }
    });

    test('не должен ничего возвращать и не должен изменять объект req', () => {
        const originalReq = { url: '/missing', method: 'GET' };
        const snapshot = JSON.stringify(originalReq);

        const result = notFoundHandler(originalReq, res);

        expect(result).toBeUndefined();
        expect(JSON.stringify(originalReq)).toBe(snapshot);
        expect(originalReq).toEqual({ url: '/missing', method: 'GET' });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 404 }));
    });
});
