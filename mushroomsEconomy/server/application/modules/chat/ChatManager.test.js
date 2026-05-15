const ChatManager = require('./ChatManager');

// Мок BaseManager – пробрасываем все опции в this
jest.mock('../../../../../global/modules/BaseManager', () => {
    return class MockBaseManager {
        constructor(options) {
            Object.assign(this, options);
        }
    };
});

// Мок Message
jest.mock('./Message', () => {
    return jest.fn().mockImplementation(({ socketId }) => ({
        guid: 'test-guid',
        socketId,
        get: jest.fn(() => ({ author: 'John', message: 'Hi' })),
    }));
});

jest.mock('../../../config', () => ({
    SOCKET: {
        MESSAGE: 'msg',
        MESSAGES: 'msgs',
        NEW_MESSAGE: 'new-msg',
    },
}));

describe('ChatManager', () => {
    let io, socket, manager;

    beforeEach(() => {
        io = {
            on: jest.fn(),
            emit: jest.fn(),
        };
        socket = {
            id: 'sock1',
            emit: jest.fn(),
            on: jest.fn(),
        };
        manager = new ChatManager({
            io,
            common: 'common',
            answer: {
                good: jest.fn(x => x),
                bad: jest.fn(code => ({ error: code })),
            },
        });
    });

    it('подписывается на события io и сокета', () => {
        expect(io.on).toHaveBeenCalledWith('connection', expect.any(Function));

        const connectionCb = io.on.mock.calls[0][1];
        connectionCb(socket);

        expect(socket.on).toHaveBeenCalledWith('msg', expect.any(Function));
        expect(socket.on).toHaveBeenCalledWith('msgs', expect.any(Function));
        expect(socket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('sendMessage возвращает ошибку при отсутствии полей', () => {
        manager.sendMessage({ message: 'text' }, socket);
        expect(socket.emit).toHaveBeenCalledWith('msg', { error: 242 });

        socket.emit.mockClear();
        manager.sendMessage({ author: 'A' }, socket);
        expect(socket.emit).toHaveBeenCalledWith('msg', { error: 242 });
    });

    it('sendMessage создаёт сообщение и рассылает всем', () => {
        manager.sendMessage({ author: 'John', message: 'Hi', date: '2025' }, socket);

        expect(require('./Message')).toHaveBeenCalledWith({
            common: 'common',
            author: 'John',
            message: 'Hi',
            socketId: 'sock1',
            date: '2025',
        });
        expect(manager.messages['test-guid']).toBeDefined();
        expect(io.emit).toHaveBeenCalledWith('new-msg', { author: 'John', message: 'Hi' });
    });

    it('getMessages отправляет все сообщения', () => {
        manager.messages = { a: 1 };
        manager.getMessages(socket);
        expect(socket.emit).toHaveBeenCalledWith('msgs', { a: 1 });
    });

    it('handleDisconnect удаляет сообщение отключившегося сокета', () => {
        // Добавляем сообщения с реальными guid и socketId
        manager.messages = {
            'g1': { guid: 'g1', socketId: 'sock1' },
            'g2': { guid: 'g2', socketId: 'sock2' },
        };

        manager.handleDisconnect(socket); // socket.id = 'sock1'

        expect(manager.messages).not.toHaveProperty('g1');
        expect(manager.messages).toHaveProperty('g2');
    });

    it('_eventDeleteMessage удаляет по guid и пишет лог', () => {
        const spy = jest.spyOn(console, 'log').mockImplementation();
        manager.messages = { x: {} };
        manager._eventDeleteMessage('x');
        expect(manager.messages).not.toHaveProperty('x');
        expect(spy).toHaveBeenCalledWith('сообщение с guid: x удалёно');
        spy.mockRestore();
    });
});