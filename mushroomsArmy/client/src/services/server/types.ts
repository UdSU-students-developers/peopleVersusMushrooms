/**
 * Пользователь
 */
export type TUser = {
    token: string;
    username: string;
    id?: number;
    guid?: string;
}

/**
 * Общий тип ответа сервера
 */
export type TResponse<T> = {
    result: 'ok' | 'error';
    data?: T;
    error?: TError;
}

/**
 * Ошибка сервера
 */
export type TError = {
    code: number;
    text: string;
}

/**
 * Данные для регистрации
 */
export type TRegistrationData = {
    name: string;
    password: string;
    confirmPassword?: string;
}

/**
 * Данные для входа
 */
export type TLoginData = {
    name: string;
    password: string;
}

/**
 * Данные для выхода
 */
export type TLogoutData = {
    token: string;
    guid: string;
}
