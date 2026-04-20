const handlers = require('./index');

jest.mock('./notFoundHandler', () => 'mockedNotFoundHandler');
jest.mock('./lobby/useLobbyUpdatedHandler', () => 'mockedLobbyUpdatedHandler');
jest.mock('./game/useStartGameHandler', () => 'mockedStartGameHandler');

describe('handlers index', () => {
    test('Проверка структуры экспорта', () => {
        expect(handlers).toBeIstanceOf(Object);

        expect(handlers).toHaveProperty('notFoundHandler');
        expect(handlers).toHaveProperty('useLobbyUpdatedHandler');
        expect(handlers).toHaveProperty('useStartGameHandler');

        expect(handlers.notFoundHandler).toBe('mockedNotFoundHandler');
        expect(handlers.useLobbyUpdatedHandler).toBe('mockedLobbyUpdatedHandler');
        expect(handlers.useStartGameHandler).toBe('mockedStartGameHandler');
    });

    test('Проверка на то откуда импортируется notFoundHandler ', () => {
        expect(require('./notFoundHandler')).toBe('mockedNotFoundHandler ')
    });
});