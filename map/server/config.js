class CONFIG {
    static SERVER_PORT = '3001'; // Хост сервера
    static SERVER_NAME = 'MAP';  // Имя сервера

    static SQLITE_PATH = './application/modules/db/test.db'; // Путь к базе

    //ивенты
    static EVENTS = {
    }

    //триггеры
    static TRIGGERS = {
        //test trigger
        TEST: 'TEST',
        TESTDB: 'TESTDB',
    }

    // сокетные сообщения
    static MESSAGES = {
        CHECK: 'CHECK',
        SEND_TO_ALL: 'SEND_TO_ALL'
    }
}

module.exports = CONFIG;