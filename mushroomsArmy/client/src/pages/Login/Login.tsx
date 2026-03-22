import React, { useState, useEffect } from "react";
import { IBasePage, PAGES } from '../PageManager';
import { validateLogin, validatePassword } from '../../utils/validation';
import './Login.css';

const Login: React.FC<IBasePage> = ({ setPage, server }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const handleLoginSuccess = () => {
            setPage(PAGES.LOBBY);
        };

        const handleError = (error: { code: number; text: string }) => {
            setErrors({ general: error.text });
            setIsLoading(false);
        };

        server.mediator.subscribe(server.mediator.getEventTypes().USER_LOGGED_IN, handleLoginSuccess);
        server.showError(handleError);

        return () => {
            server.mediator.unsubscribe(server.mediator.getEventTypes().USER_LOGGED_IN, handleLoginSuccess);
        };
    }, [server, setPage]);

    const validateField = (field: string, value: string) => {
        let error = '';
        if (field === 'username') {
            const validation = validateLogin(value);
            if (!validation.isValid) error = validation.error!;
        } else if (field === 'password') {
            const validation = validatePassword(value);
            if (!validation.isValid) error = validation.error!;
        }
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setUsername(value);
        validateField('username', value);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        validateField('password', value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const usernameValidation = validateLogin(username);
        const passwordValidation = validatePassword(password);

        if (!usernameValidation.isValid || !passwordValidation.isValid) {
            setErrors({
                username: usernameValidation.error,
                password: passwordValidation.error,
            });
            return;
        }

        setIsLoading(true);
        server.login(username, password);
    };

    return (
        <div className="login">
            <h1>Вход</h1>
            <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                    <label htmlFor="username">Логин</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={handleUsernameChange}
                        className={errors.username ? 'error' : ''}
                    />
                    {errors.username && <span className="error-text">{errors.username}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="password">Пароль</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={handlePasswordChange}
                        className={errors.password ? 'error' : ''}
                    />
                    {errors.password && <span className="error-text">{errors.password}</span>}
                </div>
                {errors.general && <div className="error-general">{errors.general}</div>}
                <button type="submit" disabled={isLoading} className="login-btn">
                    {isLoading ? 'Вход...' : 'Войти'}
                </button>
            </form>
            <p className="register-link">
                Нет аккаунта? <a href="#" onClick={(e) => { e.preventDefault(); setPage(PAGES.REGISTRATION); }}>Зарегистрироваться</a>
            </p>
        </div>
    );
}

export default Login;