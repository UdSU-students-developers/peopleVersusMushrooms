
export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Валидация логина пользователя
 * 
 * 
 * - Длина от 3 до 20 символов
 * - Допустимы латинские буквы, цифры, символы подчёркивания и точки
 * - Логин не может начинаться или заканчиваться точкой
 * - Логин не может содержать две точки подряд
 */
export function validateLogin(login: string): ValidationResult {
    if (!login || typeof login !== 'string') {
        return {
            isValid: false,
            error: 'Логин обязателен для заполнения'
        };
    }

    if (login.length < 3) {
        return {
            isValid: false,
            error: 'Логин слишком короткий (минимум 3 символа)'
        };
    }

    if (login.length > 20) {
        return {
            isValid: false,
            error: 'Логин слишком длинный (максимум 20 символов)'
        };
    }

    const validCharactersRegex = /^[a-zA-Z0-9_.]+$/;
    if (!validCharactersRegex.test(login)) {
        return {
            isValid: false,
            error: 'Логин может содержать только латинские буквы, цифры, подчёркивания и точки'
        };
    }

    if (login.startsWith('.') || login.endsWith('.')) {
        return {
            isValid: false,
            error: 'Логин не может начинаться или заканчиваться точкой'
        };
    }

    if (login.includes('..')) {
        return {
            isValid: false,
            error: 'Логин не может содержать две точки подряд'
        };
    }

    return {
        isValid: true
    };
}

/**
 * Валидация пароля пользователя
 * 
 * 
 * - Длина от 6 до 50 символов
 * - Допустимы любые символы
 */
export function validatePassword(password: string): ValidationResult {
    if (!password || typeof password !== 'string') {
        return {
            isValid: false,
            error: 'Пароль обязателен для заполнения'
        };
    }

    if (password.length < 6) {
        return {
            isValid: false,
            error: 'Пароль слишком короткий (минимум 6 символов)'
        };
    }

    if (password.length > 50) {
        return {
            isValid: false,
            error: 'Пароль слишком длинный (максимум 50 символов)'
        };
    }

    return {
        isValid: true
    };
}

/**
 * Валидация совпадения пароля и подтверждения
 */
export function validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
    if (password !== confirmPassword) {
        return {
            isValid: false,
            error: 'Пароли не совпадают'
        };
    }

    return {
        isValid: true
    };
}

/**
 * Проверка, что пароль не совпадает с логином
 */
export function validatePasswordNotLogin(login: string, password: string): ValidationResult {
    if (login === password) {
        return {
            isValid: false,
            error: 'Пароль не должен совпадать с логином'
        };
    }

    return {
        isValid: true
    };
}
