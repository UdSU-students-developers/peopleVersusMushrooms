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
    guid?: number;
    token: string;
}

export type TMap = {
    guid: string;
    map: any[];
    width: number;
    height: number;
}
