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
                            // Отправляем успех с данными пользователя
                            return socket.emit('REGISTRATION', {
                                result: 'ok',
                                user: {
                                    token: guid,
                                    name: username,
                                    id: result.lastID || result.id
                                }
                            });
                        }
                    }
                }

                // Если что-то пошло не так (юзер есть или данные пустые)
                socket.emit('REGISTRATION', { result: 'error' });
            });

            // Обработчик авторизации
            socket.on('LOGIN', async (data) => {
                const { username, password } = data;

                if (username && password) {
                    console.log(`Попытка входа: ${username}`);

                    // Проверяем в базе
                    const user = await this.db.getUserByLogin(username);

                    if (user && user.password === password) {
                        // Пользователь найден и пароль совпадает
                        return socket.emit('LOGIN', {
                            result: 'ok',
                            user: {
                                token: user.guid,
                                name: user.username,
                                id: user.id
                            }
                        });
                    }
                }

                // Если что-то пошло не так
                socket.emit('LOGIN', { result: 'error' });
            });

            // Обработчик выхода
            socket.on('LOGOUT', async (data) => {
                const { token } = data;

                console.log(`Попытка выхода пользователя с токеном: ${token}`);

                // Можно добавить дополнительную логику, например:
                // - Очистка токена в базе
                // - Логирование выхода
                // - Отключение сокета и т.д.

                // Подтверждаем успешный выход
                socket.emit('LOGOUT', { result: 'ok' });
            });
        });
    }
}

module.exports = UserManager;