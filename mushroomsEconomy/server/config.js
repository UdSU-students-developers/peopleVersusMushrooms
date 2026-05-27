const CONFIG = {
    NAME: 'Mushroom economy server',
    PORT: 3005,

    MEDIATOR: {
        EVENTS: {
            LOBBY_UPDATED: 'LOBBY_UPDATED',
            START_GAME: 'START_GAME',
            DAMAGE: 'DAMAGE',
            MOVE_UNIT: 'MOVE_UNIT',
            REQUEST_UNITS: 'REQUEST_UNITS',
            REQUEST_BUILDINGS: 'REQUEST_BUILDINGS',
        },
        TRIGGERS: {
            GET_USER_BY_GUID: 'GET_USER_BY_GUID',
            GET_USER_BY_SOCKET_ID: 'GET_USER_BY_SOCKET_ID',
            GET_MUSHROOMS_ECONOMY: 'GET_MUSHROOMS_ECONOMY',
            GET_RELIEF_HANDLER: 'GET_RELIEF_HANDLER',
            SET_SERVICES_GUIDS: 'SET_SERVICES_GUIDS',
        },
    },

    SOCKET: {
        MESSAGE: 'MESSAGE',  // шлет сообщение
        MESSAGES: 'MESSAGES',
        NEW_MESSAGE: 'NEW_MESSAGE',
        TYPING: 'TYPING',           // печатает
        
        UPDATE_SCENE: 'UPDATE_SCENE',
        GET_SCENE: 'GET_SCENE',

        RELIEF_LOADED: 'RELIEF_LOADED',
    },

    ECONOMY: {
        INTERVAL: 200, //ms (единица времени)

        DIRECTIONS: [
            { dx:  0, dy: -1 },
            { dx:  0, dy:  1 },
            { dx: -1, dy:  0 },
            { dx:  1, dy:  0 },
            { dx: -1, dy: -1 },
            { dx:  1, dy: -1 },
            { dx: -1, dy:  1 },
            { dx:  1, dy:  1 },
        ],

        MYCELIUM: {
            TYPE: 'mycelium',
            HP: 1,
            GROW_SPEED: 50,
            GROW_LEVEL_UP: 2000,
            MAX_LEVEL: 3,
            CONSUMPTION: 0, // не потребляет энергию (растёт от Солнышка)
            PRODUCTION: 30, // чтобы для непрерывной работы малого реактора было необходимо ДВЕ грибницы
            CAPACITY: 0, // ничего в себе хранить не умеет
            POWER: 1,
            SIZE: 1,
            VISIBILITY: 2, //Сколько клеток вокруг видит
            IRON_COST: 0,
        },
        // грибница вырастает за 12 секунд
        // 2*2*3 = 12 sec
        // сколько потребит инкубатор энергии за 12 секунд?
        // 12 * 5 = 60 единиц энергии потребит инкубатор за 12 секунд
        INCUBATOR: {
            TYPE: 'incubator',
            HP: 100,
            SIZE: 2,
            CONSUMPTION: 1, // энергопотребление за единицу времени
            PRODUCTION: 1,  // сколько производит за единицу времени
            CAPACITY: 60, // сколько железа доступно для производства личинок
            LARVA_ENERGY_COST: 20,
            LARVA_COOLDOWN_MS: 3000,
            VISIBILITY: 1,
            IRON_COST: 40,
        },
        BIO_REACTOR: {
            TYPE: 'reactor',
            HP: 60,
            SIZE: 2,           
            CONSUMPTION: 2,    
            PRODUCTION: 2,
            CAPACITY: 180,
            VISIBILITY: 1,
            CONSUME_RADIUS: 2,
            IRON_COST: 60,
        },
        BIO_REACTOR_SMALL: {
            TYPE: "small_reactor",
            HP: 20,
            SIZE: 1,
            CONSUMPTION: 1, // потребление ЭНЕРГИИ ИЛИ ЖИРА
            PRODUCTION: 1,  // сколько производит за единицу времени
            CAPACITY: 60, // емкость. Сколько грибочков может лежать на переработке в реакторе, чтобы он работал непрерывно
            VISIBILITY: 5,
            CONSUME_RADIUS: 1,
            IRON_COST: 30,
        },
        MINE: {
            TYPE: "mine",
            HP: 80,
            SIZE: 1,
            CONSUMPTION: 1,
            PRODUCTION: 1,
            CAPACITY: 500,
            VISIBILITY: 1,
            IRON_COST: 20,
        },
        STORAGE_IRON: {

        },
        STORAGE_FAT: {

        },
        UNIT: {
            RADIUS: 10, //максимальный радиус расчета ближайшей точки от центра стремления(больше 20 не ставить)
        },

        LARVA: {
            HP: 40,
            SPEED: 0.05,
            WANDER_RADIUS: 8, //радиус блуждания личинки
            TYPE: "larva",
            VISIBILITY: 2,
            SOURCES_VISIBILITY: 100,
            GROWTH_LIMIT: 100, //сколько тиков нужно личинке чтобы превратиться в рабочего
            MUTATION_ENERGY_COST: 15, // энергия для мутации личинки в рабочего
            MUTATION_IRON_COST: 0,
        },

        WORKER: {
            TYPE: "worker",
            HP: 60,
            SPEED: 0.08,
            WANDER_RADIUS: 8,
            VISIBILITY: 4,
            SOURCES_VISIBILITY: 3,
        },
    }
};

module.exports = CONFIG;