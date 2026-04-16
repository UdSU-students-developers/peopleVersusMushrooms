export type TError = {
    code: number;
    message: string;
}

export type TAnswer<T> = {
    result: 'ok' | 'error';
    data?: T;
    error?: TError;
}

export type TUser = {
    id?: number;
    guid?: string;
    token: string;
}

export interface IPlayer {
    guid: string;
    role: string;
    ready: boolean;
}

export interface ILobby {
    lobbyGuid: string;
    lobbyName: string;
    playersGuids: {
        spectator: string | null,
        peopleEconomy: string | null,
        peopleArmy: string | null,
        mushroomsEconomy: string | null,
        mushroomsArmy: string | null,
    }
    playersIsReady: {
        spectator: boolean,
        peopleEconomy: boolean,
        peopleArmy: boolean,
        mushroomsEconomy: boolean,
        mushroomsArmy: boolean,
    }
    gameState: 'waiting' | 'playing';
}

export type TMap = {
    guid: string;
    map: number[][];
    width: number;
    height: number;
}
