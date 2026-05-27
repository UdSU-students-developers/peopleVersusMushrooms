/** Тип ответа-ошибки от Answer.bad() */
export type TAnswerError = {
    result: 'error';
    error: {
        code: number;
        message: string;
    };
};

/** Тип успешного ответа от Answer.good() */
export type TAnswerGood<T = unknown> = {
    result: 'ok';
    data: T;
};

export type TAnswerResponse<T = unknown> = TAnswerGood<T> | TAnswerError;

/** Интерфейс объекта Answer */
export interface IAnswer {
    bad(code: number): TAnswerError;
    good<T = unknown>(data: T): TAnswerGood<T> | TAnswerError;
}

/** Интерфейс объекта Mediator */
export interface IMediator {
    getEventTypes(): Record<string, string>;
    getTriggerTypes(): Record<string, string>;
    subscribe(name: string, func: (data: unknown) => void): void;
    unsubscribe(name: string, func: (data: unknown) => void): void;
    unsubscribeAll(name?: string): void;
    call(name: string, data?: unknown): unknown;
    get(name: string, data?: unknown): unknown;
    set(name: string, func: (data: unknown) => unknown): void;
}
