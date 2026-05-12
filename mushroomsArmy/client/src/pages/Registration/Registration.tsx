import React, { useState, useEffect, useContext } from 'react';
import { MediatorContext, ServerContext } from '../../App';
import { PAGES } from '../PageManager';
import { validateRegistration } from '../../utils/validation';
import { TError } from '../../services';
import { TUser } from '../../services/server/types';
import { authStorage } from '../../utils/authStorage';
import './Registration.css';

const REG_SERVER_ERRORS: Record<number, string> = {
    13: 'Передан неполный набор параметров',
    17: 'Пользователь с данным именем уже зарегистрирован',
    18: 'Логин не соответствует формату',
    19: 'Пароль не соответствует требованиям',
    20: 'Пароли не совпадают',
};

const mapRegistrationError = (error?: TError | null): string => {
    if (!error || typeof error.code !== 'number') {
        return 'Не удалось зарегистрироваться. Попробуйте снова.';
    }
    return REG_SERVER_ERRORS[error.code] ?? error.message ?? 'Не удалось зарегистрироваться.';
};

const Registration: React.FC<{ setPage: (page: PAGES) => void }> = ({ setPage }) => {
    const server = useContext(ServerContext);
    const mediator = useContext(MediatorContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordRepeat, setPasswordRepeat] = useState('');
    const [serverError, setServerError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fieldErrors = validateRegistration(username, password, passwordRepeat);
    const hasValidationErrors =
        !!fieldErrors.login || !!fieldErrors.password || !!fieldErrors.passwordRepeat;

    useEffect(() => {
        const { USER_REGISTERED, ERROR } = mediator.getEventTypes();

        const onRegistered = (user: TUser) => {
            setIsLoading(false);
            authStorage.setAuth(user.token, user);
            setPage(PAGES.LOBBY);
        };

        const onError = (payload: TError | undefined) => {
            setServerError(mapRegistrationError(payload));
            setIsLoading(false);
        };

        mediator.subscribe(USER_REGISTERED, onRegistered);
        mediator.subscribe(ERROR, onError);

        return () => {
            mediator.unsubscribe(USER_REGISTERED, onRegistered);
            mediator.unsubscribe(ERROR, onError);
        };
    }, [mediator, setPage]);

    const clearServerError = () => setServerError('');

    const onUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
        clearServerError();
    };

    const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        clearServerError();
    };

    const onPasswordRepeatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordRepeat(e.target.value);
        clearServerError();
    };

    const onSubmit = () => {
        if (hasValidationErrors) return;
        setIsLoading(true);
        server.register(username, password, passwordRepeat);
    };

    const showLoginHint = username !== '' && !!fieldErrors.login;
    const showPasswordHint = password !== '' && !!fieldErrors.password;
    const showRepeatHint =
        !!fieldErrors.passwordRepeat && (passwordRepeat !== '' || password !== '');

    return (
        <div className="registration">
            <h1>Регистрация</h1>
            <div className="registration-form">
                <div className="form-group">
                    <label htmlFor="reg-username">Логин</label>
                    <input
                        id="reg-username"
                        type="text"
                        autoComplete="username"
                        value={username}
                        onChange={onUsernameChange}
                        className={showLoginHint ? 'error' : ''}
                    />
                    {showLoginHint && <span className="error-text">{fieldErrors.login}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="reg-password">
                        Пароль <span className="field-hint">(6–50 символов)</span>
                    </label>
                    <input
                        id="reg-password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={onPasswordChange}
                        className={showPasswordHint ? 'error' : ''}
                    />
                    {showPasswordHint && (
                        <span className="error-text">{fieldErrors.password}</span>
                    )}
                </div>
                <div className="form-group">
                    <label htmlFor="reg-password-repeat">Повтор пароля</label>
                    <input
                        id="reg-password-repeat"
                        type="password"
                        autoComplete="new-password"
                        value={passwordRepeat}
                        onChange={onPasswordRepeatChange}
                        className={showRepeatHint ? 'error' : ''}
                    />
                    {showRepeatHint && (
                        <span className="error-text">{fieldErrors.passwordRepeat}</span>
                    )}
                </div>
                {serverError && <div className="error-general">{serverError}</div>}
                <button
                    type="button"
                    className="register-btn"
                    disabled={hasValidationErrors || isLoading}
                    onClick={onSubmit}
                >
                    {isLoading ? 'Отправка…' : 'Регистрация'}
                </button>
            </div>
            <p className="login-link">
                Уже есть аккаунт?{' '}
                <button type="button" className="text-link-button" onClick={() => setPage(PAGES.LOGIN)}>
                    Войти
                </button>
            </p>
        </div>
    );
};

export default Registration;

