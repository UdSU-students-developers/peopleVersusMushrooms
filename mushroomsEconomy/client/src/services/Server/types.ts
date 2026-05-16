import { TPoint } from "../../config";

enum enitityTypes {
    MYCELIUM = 'mycelium',
    SMALL_REACTOR = "small_reactor",
    INCUBATOR = 'incubator',
};

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

export type TBuilding = {
    guid: string;
    x: number;
    y: number;
    visibility: number;
}

export type TSmallReactor = TBuilding & {
    type: enitityTypes.SMALL_REACTOR;
    consumed: boolean;
    energy?: number;
}

export type TIncubator = TBuilding & {
    type: enitityTypes.INCUBATOR;
}

export type TMushroom = TBuilding & { 
    type: enitityTypes.MYCELIUM;
    level: number;
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