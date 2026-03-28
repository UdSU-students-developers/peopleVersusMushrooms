import { TPoint } from "../../config";

export type TUser = {
    token: string;
    name: string;
    id?: number;
    guid: string;
}

export type TResponse<T> = {
    result: 'ok' | 'error';
    data?: T;
    error?: TError;
}

export type TError = {
    code: number;
    text: string;
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

export type TScene = {
    guid: string;
    mushrooms: TMushroom[];
    map: number[][];
}

export type TMessages = TMessage[];
