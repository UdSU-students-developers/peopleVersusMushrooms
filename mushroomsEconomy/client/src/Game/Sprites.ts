export const TERRAIN_SPRITES: Record<number | 'null', number> = {
    0: 1, // земля
    1: 2, // вода
    2: 3, // камень
    null: 7,
};

export const MUSHROOM_SPRITES: Record<number, number> = {
    1: 4,
    2: 5,
    3: 6,
};

export const SPRITE = {
    LARVA: 10,
    INCUBATOR: 11,
    SMALL_REACTOR: 8,
    REACTOR_CONSUMED_ANIM: 9,
    REACTOR: 8, // size = 2
    FALLBACK: 7,
    WORKER: 12,
    MINE: 14,
    ENEMY_BUILDING: 13,
    ENEMY_UNIT: 15,
    ALLY_UNIT: 16,
};

export const getTerrainSprite = (type: number | null): number =>
    TERRAIN_SPRITES[type ?? 'null'] ?? SPRITE.FALLBACK;

export const getMushroomSprite = (level: number): number =>
    MUSHROOM_SPRITES[level] ?? SPRITE.FALLBACK;