const CONFIG = {
    NAME: 'PEOPLE ECONOMY SERVER',
    PORT: 3009,

    MEDIATOR: {
        EVENTS: {
            DELETE_USER: "DELETE_USER",
            LOBBY_UPDATED: 'LOBBY_UPDATED',
            START_GAME: 'START_GAME',
            DAMAGE: 'DAMAGE'
        },
        TRIGGERS: {
            GET_USER_BY_GUID: 'GET_USER_BY_GUID',
            GET_USER_BY_SOCKET_ID: 'GET_USER_BY_SOCKET_ID',
        },
    },

    SOCKET: {
        UPDATE_SCENE: 'UPDATE_SCENE',
        GET_SCENE: 'GET_SCENE',
    },

    ECONOMY: {
        INTERVAL: 200, //ms (единица времени)
        UNIT: {
            RADIUS: 10, //максимальный радиус расчета ближайшей точки от центра стремления(больше 20 не ставить)
        },
        WORKER: {
            HP: 150,
            SPEED: 2,
            TYPE: "worker",
            VISIBILITY: 3,
        },

        //статусы поведения воркера
        WORKER_STATUS: {
            SEARCH: 0,   // брожение
            BUILD: 1,    // строительство
            FLEE: 2      // бегство
        },

        //параметры бегства (мб еще что додумать)
        FLEE: {
            DETECTION_RATIO: 1/3 // 1/3 от визибилити для обнаружения врага
        },

        BUILDINGS: {
            PIPE: {
                type: 'PIPE',
                priority: 4, 
                size: 1,
                hp: 1,
                visibility: 1,
                consumption: 0,
                production: 0,
                capacity: {
                    OIL: 0,
                    IRON: 0
                },
            },
            OIL_BARREL: {
                type: 'OIL_BARREL',
                priority: 4, 
                size: 1,
                hp: 40,
                visibility: 1,
                consumption: 0,
                production: 0,
                capacity: {
                    OIL: 12,
                    IRON: 0
                },
            },
            IRON_BARREL: {
                type: 'IRON_BARREL',
                priority: 4, 
                size: 1,
                hp: 40,
                visibility: 1,
                consumption: 0,
                production: 0,
                capacity: {
                    OIL: 0,
                    IRON: 12
                },
            },
            BARRACKS: {
                type: 'BARRACKS', 
                priority: 3,
                size: 2,
                hp: 300,
                visibility: 4,
                consumption: 4,
                production: 0,
                capacity: {
                    OIL: 0,
                    IRON: 120
                },
            },
            SMALL_REACTOR: {
                type: 'SMALL_REACTOR',
                priority: 1, 
                size: 1,
                hp: 20,
                visibility: 2,
                consumption: 2,
                production: 8,
                capacity: {
                    OIL: 4,
                    IRON: 0
                },
            },
            LARGE_REACTOR: {
                type: 'LARGE_REACTOR', 
                priority: 1,
                size: 2,
                hp: 60,
                visibility: 4,
                consumption: 4,
                production: 20,
                capacity: {
                    OIL: 8,
                    IRON: 0
                },
            },
            DRILLER: {
                type: 'DRILLER', 
                priority: 2,
                size: 1,
                hp: 30,
                visibility: 3,
                consumption: 2,
                production: 4,
                capacity: {
                    OIL: 6,
                    IRON: 0
                },
            },
            MINE: {
                type: 'MINE', 
                priority: 2,
                size: 1,
                hp: 30,
                visibility: 3,
                consumption: 2,
                production: 2,
                capacity: {
                    OIL: 0,
                    IRON: 6
                },
            }
        },

        UNITS: {
            BMP: {
                COST: 120,
                INERTIA: 300,
                TYPE: 'bmp'
            },
            PARTIZAN: {
                COST: 50,
                INERTIA: 140,
                TYPE: 'partizan'
            },
            SNIPER: {
                COST: 40,
                INERTIA: 100,
                TYPE: 'sniper'
            },
            SOLDIER: {
                COST: 30,
                INERTIA: 60,
                TYPE: 'soldier'
            },
            WORKER: {
                COST: 40,
                INERTIA: 60,
                TYPE: 'worker'
            }
        },

        RESOURSES: {
            IRON: 'IRON',
            OIL: 'OIL',
            ENERGY: 'ENERGY'
        }
    }
};

module.exports = CONFIG;