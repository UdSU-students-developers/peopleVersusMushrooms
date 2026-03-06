class CONFIG {
    static SERVER_PORT = '3001'; // Хост сервера
    static SERVER_NAME = 'MAP';  // Имя сервера

    static SQLITE_PATH = './application/modules/db/map.db'; // Путь к базе

    //ивенты
    static EVENTS = {
    }

    //триггеры
    static TRIGGERS = {
        //user trigger
        LOGIN: 'LOGIN',
        REGISTRATION: 'REGISTRATION',
        LOGOUT: 'LOGOUT',
    }

    // сокетные сообщения
    static MESSAGES = {
        CHECK: 'CHECK',
        SEND_TO_ALL: 'SEND_TO_ALL',
        //user sockets
        LOGIN: 'LOGIN',
        REGISTRATION: 'REGISTRATION',
        LOGOUT: 'LOGOUT',
    }
}

module.exports = CONFIG;