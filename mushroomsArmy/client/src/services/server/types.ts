/**
 * Ошибка сервера
 */
export type TError = {
    code: number;
    message: string;
}

/**
 * Общий тип ответа сервера
 */
export type TResponse<T> = {
    result: 'ok' | 'error';
    data?: T;
    error?: TError;
}

/**
 * Пользователь
 */
export type TUser = {
    token: string;
    name: string;
    id?: number;
    guid?: string;
}

export interface ILobby {
    lobbyGuid: string;
    lobbyName: string;
    playersGuids: {
        spectator: string | null;
        mushroomsArmy: string | null;
        mushroomsEconomy: string | null;
        peopleArmy: string | null;
        peopleEconomy: string | null;
    };
    playersIsReady: {
        spectator: boolean;
        mushroomsArmy: boolean;
        mushroomsEconomy: boolean;
        peopleArmy: boolean;
        peopleEconomy: boolean;
    };
}

/**
 * Данные для регистрации
 */
export type TRegistrationData = {
    name: string;
    password: string;
    confirmPassword?: string;
}

/**
 * Данные для входа
 */
export type TLoginData = {
    name: string;
    password: string;
}

/**
 * Данные для выхода
 */
export type TLogoutData = {
    token: string;
    guid: string;
}

// Юнит на карте (isAlive вычисляется: hp > 0)
export type TUnit = {
    guid: string;
    type: string;
    x: number;
    y: number;
    hp: number;
    visibility?: number;
    isHealing?: boolean;
}

// Здание (цель для армии грибов)
export type TBuilding = {
    guid: string;
    type: string;
    x: number;
    y: number;
    hp: number;
    sizeX?: number;
    sizeY?: number;
    isAlive?: boolean;
    isExploding?: boolean;
    isAttacking?: boolean;
}

// Лужа слайма
export type TSlimePool = {
    x: number;
    y: number;
    radius: number;
    ttl: number;
}

// Снаряд
export type TProjectile = {
    guid: string;
    type: 'sporomet' | 'sporovaya_bashnya' | 'eblekar';
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    createdAt: number;
}

// Карта — матрица 100x100 (0=равнина, 1=вода, 2=горы, null=неизвестно)
export type TMapData = (number | null)[][];

// Состояние армии (приходит каждые 200мс через game:state)
export type TArmyState = {
    map: TMapData;
    units: TUnit[];
    enemyUnits?: TUnit[];
    buildings: TBuilding[];
    slimePuddles: TSlimePool[];
    projectiles: TProjectile[];
};
