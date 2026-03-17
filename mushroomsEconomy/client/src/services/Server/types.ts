export type TUser = {
    token: string;
    name: string;
    id?: number;
}

export type TResponse<T> = {
    result: 'ok' | 'error';
    data?: T;
    error?: {
        code: number;
        text: string;
    }
}

export type TError = {
    code: number;
    text: string;
}