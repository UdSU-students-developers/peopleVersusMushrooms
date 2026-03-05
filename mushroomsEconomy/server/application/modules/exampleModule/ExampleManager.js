const Example = require("./Example");
const BaseManager = require('../BaseManager');
const CONFIG = require("../../../config");

class ExampleManager extends BaseManager {
    constructor(options) {
        super(options);

        if (!this.io) return;

        this.io.on('connection', (socket) => {

            socket.on(CONFIG.SOCKET.CLIENT.SEND_MESSAGE, (data) => this.socketChatMessage(data, socket));

            socket.on('disconnect', () => console.log('disconnect', socket.id));
        });

    }

    socketChatMessage(data = {}, socket) {
		const { name, text } = data;
		if (name && text) {
			this.messages.push({ name, text });
			socket.emit(CONFIG.SOCKET.CLIENT.SEND_MESSAGE, 'ok');
			this.io.emit(CONFIG.SOCKET.SERVER.NEW_MESSAGE, this.messages); // выслать сообщение всем активным абонентам
		}
	}

    check(token) {
        console.log('пример манагера!');
    }

}

module.exports = ExampleManager;