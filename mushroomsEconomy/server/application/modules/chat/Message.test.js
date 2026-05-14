const Message = require('./Message');

describe('Message', () => {
    let mockCommon;

    beforeEach(() => {
        mockCommon = {
            guid: jest.fn(() => 'unique-guid-123')
        };
    });

    describe('Конструктор', () => {
        it('должен присвоить socketId', () => {
            const msg = new Message({ common: mockCommon, author: 'Вася', message: 'Привет', socketId: 'socket-1' });
            expect(msg.socketId).toBe('socket-1');
        });

        it('должен сгенерировать guid через common.guid()', () => {
            const msg = new Message({ common: mockCommon, author: 'Вася', message: 'Привет', socketId: 'socket-1' });
            expect(mockCommon.guid).toHaveBeenCalledTimes(1);
            expect(msg.guid).toBe('unique-guid-123');
        });

        it('должен сохранить автора и сообщение', () => {
            const msg = new Message({ common: mockCommon, author: 'Петя', message: 'Тест', socketId: 's2' });
            expect(msg.author).toBe('Петя');
            expect(msg.message).toBe('Тест');
        });

        it('должен установить дату как текущий момент', () => {
            const before = new Date();
            const msg = new Message({ common: mockCommon, author: 'a', message: 'b', socketId: 's' });
            const after = new Date();
            expect(msg.date instanceof Date).toBe(true);
            expect(msg.date.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(msg.date.getTime()).toBeLessThanOrEqual(after.getTime());
        });
    });

    describe('Метод get', () => {
        it('должен вернуть объект с полями socketId, guid, author, message, date', () => {
            const msg = new Message({ common: mockCommon, author: 'Анна', message: 'Hello', socketId: 's3' });
            const result = msg.get();
            expect(result).toEqual({
                socketId: 's3',
                guid: 'unique-guid-123',
                author: 'Анна',
                message: 'Hello',
                date: msg.date
            });
        });
    });
});