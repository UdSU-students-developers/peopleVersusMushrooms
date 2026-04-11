import React, { useState, useEffect, useContext } from 'react';
import { MediatorContext, ServerContext } from '../../App';
import { PAGES } from '../PageManager';
import { validateLogin, validatePassword } from '../../utils/validation';
import { TError } from '../../services';
import './Login.css';

const LOGIN_SERVER_ERRORS: Record<number, string> = {
    10: 'Токен истёк или недействителен',
    11: 'Неверный логин или пароль',
    13: 'Передан неполный набор параметров',
};

const mapLoginError = (error?: TError | null): string => {
    if (!error || typeof error.code !== 'number') {
        return 'Не удалось выполнить вход. Попробуйте снова.';
    }
    return LOGIN_SERVER_ERRORS[error.code] ?? error.text ?? 'Не удалось выполнить вход.';
};

const Login: React.FC<{ setPage: (page: PAGES) => void }> = ({ setPage }) => {
    const server = useContext(ServerContext);
    const mediator = useContext(MediatorContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [serverError, setServerError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const loginCheck = validateLogin(username);
    const passwordCheck = validatePassword(password);
    const hasValidationErrors = !loginCheck.isValid || !passwordCheck.isValid;

    useEffect(() => {
        const { LOGIN, ERROR } = mediator.getEventTypes();

        const onLoggedIn = () => {
            setIsLoading(false);
            setPage(PAGES.LOBBY);
        };

        const onError = (payload: TError | undefined) => {
            setServerError(mapLoginError(payload));
            setIsLoading(false);
        };

        mediator.subscribe(LOGIN, onLoggedIn);
        mediator.subscribe(ERROR, onError);

        return () => {
            mediator.unsubscribe(LOGIN, onLoggedIn);
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

    const onSubmit = () => {
        if (hasValidationErrors) return;
        setIsLoading(true);
        server.login(username, password);
    };

    return (
        <div className="login">
            <h1>Вход</h1>
            <div className="login-form">
                <div className="form-group">
                    <label htmlFor="username">Логин</label>
                    <input
                        id="username"
                        type="text"
                        autoComplete="username"
                        value={username}
                        onChange={onUsernameChange}
                        className={!loginCheck.isValid && username !== '' ? 'error' : ''}
                    />
                    {!loginCheck.isValid && username !== '' && (
                        <span className="error-text">{loginCheck.error}</span>
                    )}
                </div>
                <div className="form-group">
                    <label htmlFor="password">
                        Пароль{' '}
                        <span className="field-hint">(6–50 символов)</span>
                    </label>
                    <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={onPasswordChange}
                        className={!passwordCheck.isValid && password !== '' ? 'error' : ''}
                    />
                    {!passwordCheck.isValid && password !== '' && (
                        <span className="error-text">{passwordCheck.error}</span>
                    )}
                </div>
                {serverError && <div className="error-general">{serverError}</div>}
                <button
                    type="button"
                    className="login-btn"
                    disabled={hasValidationErrors || isLoading}
                    onClick={onSubmit}
                >
                    {isLoading ? 'Вход…' : 'Войти'}
                </button>
            </div>
            <p className="register-link">
                Нет аккаунта?{' '}
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        setPage(PAGES.REGISTRATION);
                    }}
                >
                    Зарегистрироваться
                </a>
            </p>
        </div>
    );
};

export default Login;
