import { TPoint } from "../../config";

export type TResponse<T> = {
    result: 'ok' | 'error';
    data?: T;
    error?: TError;
}

export type TError = {
    code: number;
    text: string;
}

export type TUser = {
    token: string;
    name: string;
    id?: number;
    guid: string;
}

export type TMessage = {
    message: string;
    author: string;
    created: string;
}

export type TMushroom = {
    guid: string;
    level: number;
    coords: TPoint
}

export type TSmallReactor = {
    guid: string;
    coords: TPoint;
    type: "small_reactor";
}

export type TScene = {
    guid: string;
    mushrooms: TMushroom[];
    buildings: (TSmallReactor | number)[]; //number тут временно, загатовка на разные типы
    map: number[][];
}

export type TMessages = TMessage[];

type TPlayer = {
    guid: string;
    ready: boolean;
}

type TLobby = {
    creatorGuid: string;
    lobbyName: string;
    players: TPlayer[];
}

export type TLobbies = TLobby[];