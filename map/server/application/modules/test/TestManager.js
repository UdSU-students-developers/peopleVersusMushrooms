const { MESSAGES } = require("../../../config");
const BaseManager = require("../BaseManager");

class TestManager extends BaseManager {
    constructor(options) {
        super(options);
        if (!this.io) return;
        // Устанавливаем обработчик socket.io запросов
        this.io.on('connection', socket => {

            console.log(`Пользователь подключился с id ${socket.id}`);

            socket.on(MESSAGES.CHECK, data => this.socketCheck(data, socket));
            socket.on('disconnect', () => this.socketDisconnect(socket));
        });

        // Устанавливаем обработчики для триггеров
        this.mediator.set(this.TRIGGERS.TEST, (params) => this.triggerTest(params));
        this.mediator.set(this.TRIGGERS.TESTDB, (params) => this.triggerTestDB(params));
    }

    async test(params) {
        const { data1, data2 } = params;

        return `вы ввели: ${data1} и ${data2}`;;
    }

    async testDB(params) {
        const { userId } = params;

        const user = await this.db.getUserById(userId);

        if (!user) {
            return { error: 1001 };
        }

        return user.name;
    }

    socketCheck(data, socket) {
        const { name, text } = data;
        socket.emit(MESSAGES.CHECK, 'ok');
        this.io.emit(MESSAGES.SEND_TO_ALL, data);
    }

    socketDisconnect(socket) {
        console.log(`Пользователь ${socket.id} отключился`);
    }

    /*test.db:
    1 - Oleg
    2 - Max
    3 - Petr
    */

}

module.exports = TestManager;