const CONFIG = require('../../../config');
const BaseManager = require('../BaseManager');

const { MESSAGE_FROM_CLIENT, MESSAGE_TO_CLIENTS } = CONFIG.SOCKET;

class ChatManager extends BaseManager {
    constructor(options) {
        super(options);
        
        if (!this.io) return;
        this.io.on('connection', (socket) => {
            socket.on(MESSAGE_FROM_CLIENT, (data) => this.socketMessageFromClient(data, socket));
            socket.on('disconnect', () => {
                console.log(`[Chat] Клиент отключился: ${socket.id}`);
            });
        });
    }

    socketMessageFromClient(data, socket) {
        if (data) {
        const text = typeof data === 'string' ? data : (data.text ?? '');
        const timestamp = data.timestamp ?? new Date().toISOString();
        const payload = {
            type: 'message',
            data: { text, timestamp },
            from: socket.id,
            timestamp
        };
            socket.emit(MESSAGE_FROM_CLIENT, 'ok');
            this.io.emit(MESSAGE_TO_CLIENTS, payload);
        }
    }
}

module.exports = ChatManager;



