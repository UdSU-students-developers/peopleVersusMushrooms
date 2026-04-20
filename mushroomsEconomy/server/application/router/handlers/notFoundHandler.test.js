const handler = require('./notFoundHandler');

test('Проверка вывода "not found" ', () => {
    const res = { send: jest.fn() }
    handler(null, res);
    expect(res.send).toHaveBeenCalledWith('not found');
});