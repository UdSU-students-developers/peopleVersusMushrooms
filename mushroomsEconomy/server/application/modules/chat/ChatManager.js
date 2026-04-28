//GLOBAL
const BaseManager = require('../../../../../global/modules/BaseManager');

// LOCAL
const Message = require("./Message");
const CONFIG = require("../../../config");

const { MESSAGE, MESSAGES, NEW_MESSAGE } = CONFIG.SOCKET;

class ChatManager extends BaseManager {
    constructor(options) {
        super(options);

        this.messages = {};

        if (!this.io) return;
        this.io.on('connection', (socket) => {
            socket.on(MESSAGE, (data) => this.sendMessage(data, socket));
            socket.on(MESSAGES, () => this.getMessages(socket));
            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
    }

    /* SOCKETS */

    handleDisconnect(socket) {
        this._eventDeleteMessage(this._triggerGetMessageBySocketId(socket.id));
    };

    getMessages(socket) {
        return socket.emit(MESSAGES, this.answer.good(this.messages));
    }

    sendMessage(data = {}, socket) {
        const { author, message, date } = data;

        if (!author || !message) {
            return socket.emit(MESSAGE, this.answer.bad(242));
        }

        const newMessage = new Message({
            common: this.common,
            author: author,
            message: message,
            socketId: socket.id,
            date: date
        });
        this.messages[newMessage.guid] = newMessage;

        this.io.emit(NEW_MESSAGE, this.answer.good(newMessage.get()));
    }

    /* PRIVATE */

    _eventDeleteMessage(guid) {
        if (guid && this.messages[guid]) {
            delete this.messages[guid];
            console.log(`сообщение с guid: ${this.message.guid} удалёно`);
        }
    }

    _triggerGetMessageBySocketId(socketId) {
        return Object.values(this.messages).find(mes => mes.socketId === socketId) || null;
    }

    /* TRIGGGERS */
    
    triggerGetUserBySocketId(socketId) {
        return Object.values(this.messages).find(mes => mes.socketId === socketId) || null;
    }
}

module.exports = ChatManager;