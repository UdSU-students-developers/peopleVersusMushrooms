const BaseManager = require("../BaseManager");
const Message = require("./Message");
const CONFIG = require("../../../config");

const { MESSAGE, MESSAGES, NEW_MESSAGE } = CONFIG.SOCKET;

class ChatManager extends BaseManager {
    constructor(options) {
        super(options);
        this.messages = [];

        if (!this.io) return;

        this.io.on('connection', (socket) => {
            socket.on(MESSAGE, (data) => this.sendMessage(data, socket));
            socket.on(MESSAGES, () => this.getMessages(socket));

            socket.on('disconnect', () => console.log('disconnect', socket.id));
        });
    }

    
    sendMessage(data = {}, socket) {
        const { author, message } = data;

        if (!author || !message) {
            return socket.emit(MESSAGE, this.answer.bad(13));
        }

        const newMessage = new Message({
            common: this.common,
            author: author,
            message: message
        });

        this.messages.push(newMessage.get());

        this.io.emit(NEW_MESSAGE, this.answer.good(newMessage.get()));
    }

    getMessages(socket) {
        return socket.emit(MESSAGES, this.answer.good(this.messages));
    }

}

module.exports = ChatManager;