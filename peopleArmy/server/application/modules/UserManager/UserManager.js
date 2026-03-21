const BaseManager = require('../BaseManager');
const Common = require('../common/Common');

class UserManager extends BaseManager {
    constructor(options) {
        super(options);
        // Создаем экземпляр твоего помощника для генерации GUID
        this.common = new Common();

        // Проверяем, что сервер сокетов доступен
        if (!this.io) return;

        // Слушаем новые подключения
        this.io.on('connection', (socket) => {
            console.log(`[User] Новое подключение: ${socket.id}`);

            // Слушаем событие регистрации
            socket.on('REGISTRATION', async (data) => {
                const { username, password } = data;

                // Проверяем, что клиент прислал и логин, и пароль
                if (username && password) {
                    // Генерируем уникальный ключ через твой метод guid()
                    const guid = this.common.guid();

                    console.log(`Попытка регистрации: ${username}`);

                    // Проверяем в базе, нет ли такого юзера
                    const user = await this.db.getUserByLogin(username);

                    if (!user) {
                        // Если юзера нет — записываем его
                        const result = await this.db.addUser(username, password, guid);

                        if (result) {
                            // Отправляем успех только этому клиенту
                            return socket.emit('REGISTRATION', { result: 'ok' });
                        }
                    }
                }

                // Если что-то пошло не так (юзер есть или данные пустые)
                socket.emit('REGISTRATION', { result: 'error' });
            });

            // Здесь мы позже добавим socket.on('LOGIN') и socket.on('LOGOUT')
        });
    }
}

module.exports = UserManager;