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
    creatorGuid: string;
    lobbyName: string;
    players: IPlayer[];
    gameState: 'waiting' | 'playing';
}

export type TMap = {
    guid: string;
    map: any[];
    width: number;
    height: number;
}
