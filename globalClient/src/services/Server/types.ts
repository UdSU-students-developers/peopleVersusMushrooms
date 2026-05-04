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
    coords: TPoint;
}

export type TSmallReactor = {
    guid: string;
    coords: TPoint;
    type: "small_reactor";
    hp: number;
    size: number;
    energy: number;
    consumed: boolean;
}

export type TIncubator = {
    guid: string;
    coords: TPoint;
    type: "incubator";
    hp: number;
    size: number;
}

export type TMycelium = {
    guid: string;
    level: number;
    coords: TPoint;
}

export type TLarva = {
    guid: string;
    coords: TPoint;
    hp: number;
    speed: number;
}

export type TBuilding = TSmallReactor | TIncubator | TMycelium;

export type TUnit = TLarva;

export type TScene = {
    guid: string;
    buildings: TBuilding[];
    units: TUnit[];
    map: {
        relief: number[][];
    };
}

export type TMessages = TMessage[];

export type TLobbies = TLobby[];

export type TLobbyServer = {
    lobbyGuid: string;
    lobbyName: string;
    playersGuids: Record<string, string | null>; 
    playersIsReady?: Record<string, boolean>;
}

export type TPlayer = {
    guid: string;
    ready: boolean;
    role: string;
}

export type TLobby = {
    lobbyGuid: string;
    lobbyName: string;
    players: TPlayer[];
}

export type TRelief = {
    mapGuid: string;
    map: number[][];
}