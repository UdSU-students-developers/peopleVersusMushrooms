/** Тактический тик планирования: каждые N тиков Army (200 мс × 2 = 400 мс). */
const PLAN_EVERY_TICKS = 2;

/** Точка марша, когда врагов нет в видимости (зона грибов). */
const MARCH_OBJECTIVE = { x: 95, y: 95 };

/** Резервирование цели (сек). */
const RESERVATION_TTL_SEC = 2.5;

/** Last seen позиция врага (сек). */
const LAST_SEEN_TTL_SEC = 8;

/** Базовые кулдауны выстрела по типу (сек) + jitter до 0.35 с в Unit. */
const SHOT_COOLDOWN_BY_TYPE = {
    soldier: 1.8,
    sniper: 2.2,
    bmp: 2.6,
    partizan: 2.0,
};

/** Угроза по типу врага (для utility score). */
const THREAT_BY_ENEMY_TYPE = {
    champigneb: 28,
    sporomet: 22,
    sporovaya_bashnya: 20,
    vzryvomor: 16,
    pizdoglyad: 4,
    eblekar: 8,
    incubator: 14,
    reactor: 12,
    mycelium: 6,
    mine: 10,
};

/** Дистанция отхода для дальнобойных. */
const RETREAT_RANGE_BY_TYPE = {
    sniper: 5,
    partizan: 4,
};

/** Смещения слотов формации относительно якоря (dx вправо, dy вниз по карте). */
const FORMATION_SLOTS = {
    bmp: [{ dx: 0, dy: -2 }],
    soldier: [{ dx: -2, dy: -1 }, { dx: 2, dy: -1 }],
    sniper: [{ dx: -1, dy: 2 }, { dx: 1, dy: 2 }],
    partizan: [{ dx: -3, dy: 0 }, { dx: 3, dy: 0 }],
};

module.exports = {
    PLAN_EVERY_TICKS,
    MARCH_OBJECTIVE,
    RESERVATION_TTL_SEC,
    LAST_SEEN_TTL_SEC,
    SHOT_COOLDOWN_BY_TYPE,
    THREAT_BY_ENEMY_TYPE,
    RETREAT_RANGE_BY_TYPE,
    FORMATION_SLOTS,
};
