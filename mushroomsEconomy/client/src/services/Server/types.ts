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

export type TMessages = TMessage[];


export type TGuids = {
    spectator: string | null;
    peopleArmy: string | null;
    peopleEconomy: string | null;
    mushroomsArmy: string | null;
    mushroomsEconomy: string | null;
    mapGuid: string | null;
}

export type TReady = {
    spectator: boolean;
    peopleArmy: boolean;
    peopleEconomy: boolean;
    mushroomsArmy: boolean;
    mushroomsEconomy: boolean;
}

export type TResourcePoint = {
    x: number;
    y: number;
    value: number;
}

// ========= ЗДАНИЯ ======

export type TSmallReactor = {
    guid: string;
    x: number;
    y: number;
    type: "small_reactor";
    consumed: boolean;
    energy?: number;
}

export type TIncubator = {
    guid: string;
    x: number;
    y: number;
    type: "incubator";
}

export type TMushroom = { 
    type: 'mycelium';
    guid: string;
    level: number;
    x: number;
    y: number;
}

export type TEconomyBuildings = {
    smallReactors: TSmallReactor[];
    incubators: TIncubator[];
    mycelium: TMushroom[];
}

// ============= ЮНИТЫ ============

export type TUnit = {
    guid: string;
    x: number;
    y: number;
    coords: {x: number, y:number},
    type: string;
    visibility: number;
}

export type TWorker = TUnit & {
    hp: number;
    speed: number;
}

export type TLarva = TUnit & {
    hp: number;
    speed: number;
    growthScale: number;
}

export type TEconomyUnits = {
    workers: TWorker[];
    larvae: TLarva[];
}


//=======================

export type TEconomy = {
    guids: TGuids;
    buildings: TEconomyBuildings;
    units: TEconomyUnits;
    map: TMap;
}

export type TMap = {
    relief: TRelief;
    resurces: (TResourcePoint | null)[];

}

export type TScene = {
    guid: string;
    buildings: TEconomyBuildings
    map: TMap;
    units: TEconomyUnits;
}

export type TLobby = {
    lobbyGuid: string;
    lobbyName: string;
    playersGuids: TGuids;
    playersIsReady: TReady;
}

export type TLobbies = TLobby[];

export type TRelief = (number | null)[][];