const CONFIG = {
    NAME: 'Mushroom economy server',
    PORT: 3005,

    MEDIATOR: {
        EVENTS: {
            LOBBY_UPDATED: 'LOBBY_UPDATED',
            START_GAME: 'START_GAME',
        },
        TRIGGERS: {
            GET_USER_BY_GUID: 'GET_USER_BY_GUID',
            GET_USER_BY_SOCKET_ID: 'GET_USER_BY_SOCKET_ID',
            GET_MUSHROOMS_ECONOMY: 'GET_MUSHROOMS_ECONOMY',
        },
    },

    SOCKET: {
        MESSAGE: 'MESSAGE',  // шлет сообщение
        MESSAGES: 'MESSAGES',
        NEW_MESSAGE: 'NEW_MESSAGE',
        TYPING: 'TYPING',           // печатает
        
        UPDATE_SCENE: 'UPDATE_SCENE',
        GET_SCENE: 'GET_SCENE',
    },

    ECONOMY: {
        INTERVAL: 200, //ms (единица времени)

        MYCELIUM: {
            TYPE: 'mycelium',
            HP: 1,
            GROW_SPEED: 100,
            GROW_LEVEL_UP: 2000,
            MAX_LEVEL: 3,
            CONSUMPTION: 0, // не потребляет энергию (растёт от Солнышка)
            PRODUCTION: 30, // чтобы для непрерывной работы малого реактора было необходимо ДВЕ грибницы
            CAPACITY: 0, // ничего в себе хранить не умеет
            POWER: 1,
            SIZE: 1,
        },
        // грибница вырастает за 12 секунд
        // 2*2*3 = 12 sec
        // сколько потребит инкубатор энергии за 12 секунд?
        // 12 * 5 = 60 единиц энергии потребит инкубатор за 12 секунд
        INCUBATOR: {
            HP: 100,
            SIZE: 2,
            CONSUMPTION: 1, // энергопотребление за единицу времени
            PRODUCTION: 1,  // сколько производит за единицу времени
            CAPACITY: 60, // сколько железа доступно для производства личинок
        },
        BIO_REACTOR: {

        },
        BIO_REACTOR_SMALL: {
            TYPE: "small_reactor",
            HP: 20,
            SIZE: 1,
            CONSUMPTION: 1, // потребление ЭНЕРГИИ ИЛИ ЖИРА
            PRODUCTION: 1,  // сколько производит за единицу времени
            CAPACITY: 60, // емкость. Сколько грибочков может лежать на переработке в реакторе, чтобы он работал непрерывно
        },
        MINE: {

        },
        STORAGE_IRON: {

        },
        STORAGE_FAT: {

        },
        UNIT: {
            RADIUS: 10, //максимальный радиус расчета ближайшей точки от центра стремления(больше 20 не ставить)
        },
        WORKER: {
            HP: 100,
            SPEED: 1,
        },
        LARVA: {
            HP: 40,
            SPEED: 1,
            WANDER_RADIUS: 4, //радиус блуждания личинки
        }
    }
};

module.exports = CONFIG;