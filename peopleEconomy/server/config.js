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
            HP: 60,
            SPEED: 0.02,
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
                hp: 200,
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
                production: 6,
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
                    OIL: 12,
                    IRON: 0
                },
            },
            DRILLER: {
                type: 'DRILLER', 
                priority: 2,
                size: 1,
                hp: 50,
                visibility: 3,
                consumption: 2,
                production: 4,
                capacity: {
                    OIL: 10,
                    IRON: 0
                },
            },
            MINE: {
                type: 'MINE', 
                priority: 2,
                size: 1,
                hp: 60,
                visibility: 3,
                consumption: 2,
                production: 2,
                capacity: {
                    OIL: 0,
                    IRON: 10
                },
            }
        },

        UNITS: {
            BMP: {
                COST: 130,
                INERTIA: 3250,
                TYPE: 'bmp'
            },
            PARTIZAN: {
                COST: 55,
                INERTIA: 1550,
                TYPE: 'partizan'
            },
            SNIPER: {
                COST: 45,
                INERTIA: 1800,
                TYPE: 'sniper'
            },
            SOLDIER: {
                COST: 30,
                INERTIA: 1360,
                TYPE: 'soldier'
            },
            WORKER: {
                COST: 35,
                INERTIA: 1360,
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