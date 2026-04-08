export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Логин: 3–20 символов, только буквы/цифры/_/., без .. и точек в начале/конце.
 */
export function validateLogin(login: string): ValidationResult {
    if (!login || typeof login !== 'string') {
        return {
            isValid: false,
            error: 'Логин обязателен для заполнения',
        };
    }

    if (login.length < 3) {
        return {
            isValid: false,
            error: 'Логин слишком короткий (минимум 3 символа)',
        };
    }

    if (login.length > 20) {
        return {
            isValid: false,
            error: 'Логин слишком длинный (максимум 20 символов)',
        };
    }

    const validCharactersRegex = /^[a-zA-Z0-9_.]+$/;
    if (!validCharactersRegex.test(login)) {
        return {
            isValid: false,
            error: 'Только латинские буквы, цифры, «_» и «.»',
        };
    }

    if (login.startsWith('.') || login.endsWith('.')) {
        return {
            isValid: false,
            error: 'Логин не может начинаться или заканчиваться точкой',
        };
    }

    if (login.includes('..')) {
        return {
            isValid: false,
            error: 'Логин не может содержать две точки подряд',
        };
    }

    return { isValid: true };
}

/** Пароль: от 6 до 50 символов включительно. */
export function validatePassword(password: string): ValidationResult {
    if (!password || typeof password !== 'string') {
        return {
            isValid: false,
            error: 'Пароль обязателен для заполнения',
        };
    }

    if (password.length < 6) {
        return {
            isValid: false,
            error: 'Пароль слишком короткий (минимум 6 символов)',
        };
    }

    if (password.length > 50) {
        return {
            isValid: false,
            error: 'Пароль слишком длинный (максимум 50 символов)',
        };
    }

    return { isValid: true };
}

function validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
    if (password !== confirmPassword) {
        return {
            isValid: false,
            error: 'Пароли не совпадают',
        };
    }
    return { isValid: true };
}

function validatePasswordNotLogin(login: string, password: string): ValidationResult {
    if (login === password) {
        return {
            isValid: false,
            error: 'Пароль не должен совпадать с логином',
        };
    }
    return { isValid: true };
}

/** Ошибки по полям для формы регистрации. */
export function validateRegistration(
    login: string,
    password: string,
    passwordRepeat: string
) {
    const errors: Partial<Record<'login' | 'password' | 'passwordRepeat', string>> = {};

    const loginRes = validateLogin(login);
    if (!loginRes.isValid) {
        errors.login = loginRes.error;
    }

    const passRes = validatePassword(password);
    if (!passRes.isValid) {
        errors.password = passRes.error;
    }

    const matchRes = validatePasswordMatch(password, passwordRepeat);
    if (!matchRes.isValid) {
        errors.passwordRepeat = matchRes.error;
    }

    const notLoginRes = validatePasswordNotLogin(login, password);
    if (!notLoginRes.isValid && !errors.password) {
        errors.password = notLoginRes.error;
    }

    return errors;
}
