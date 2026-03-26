const CONFIG = require('../../../config');
const BaseManager = require('../BaseManager');

const { MESSAGE_FROM_CLIENT, MESSAGE_TO_CLIENTS } = CONFIG.SOCKET;

class ChatManager extends BaseManager {
    constructor(options) {
        super(options);

        // sockets
        if (!this.io) return;
        this.io.on('connection', (socket) => {
            socket.on(MESSAGE_FROM_CLIENT, (data) => this.socketMessageFromClient(data, socket));
        });
    }

    socketMessageFromClient(data = {}, socket) {
        const { text, timestamp, guid } = data;
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (user && text && timestamp) {
            const payload = {
                type: 'message',
                text,
                from: user.username,
                timestamp
            };
            this.io.to(user.socketId).emit(MESSAGE_FROM_CLIENT, this.answer.good('ok'))
            this.io.emit(MESSAGE_TO_CLIENTS, this.answer.good(payload));
            return;
        }
        socket.emit(MESSAGE_FROM_CLIENT, this.answer.bad(400));
    }
}

module.exports = ChatManager;



