import React, { useState, useEffect, useContext } from "react";
import { MediatorContext, ServerContext } from "../../App";
import { IBasePage, PAGES } from '../PageManager';
import { validateLogin, validatePassword } from '../../utils/validation';
import { TError } from "../../services";

import './Login.css';

const Login: React.FC<IBasePage> = ({ setPage }) => {
    const server = useContext(ServerContext);
    const mediator = useContext(MediatorContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const { LOGIN, SHOW_ERROR } = mediator.getEventTypes();

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

    const handleSubmit = () => {
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

    useEffect(() => {
        const userLoggedInHandler = () => setPage(PAGES.LOBBY);

        const errorHandler = (error: TError) => {
            setErrors({ general: error.text });
            setIsLoading(false);
        };

        mediator.subscribe(LOGIN, userLoggedInHandler);
        mediator.subscribe(SHOW_ERROR, errorHandler);

        return () => {
            mediator.unsubscribe(LOGIN, userLoggedInHandler);
            mediator.unsubscribe(SHOW_ERROR, errorHandler);
        };
    });

    return (
        <div className="login">
            <h1>Вход</h1>
            <div className="login-form">
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
                <button 
                    disabled={isLoading} 
                    className="login-btn"
                    onClick={handleSubmit}
                >
                    {isLoading ? 'Вход...' : 'Войти'}
                </button>
            </div>
            <p className="register-link">
                Нет аккаунта? <a href="#" onClick={(e) => { e.preventDefault(); setPage(PAGES.REGISTRATION); }}>Зарегистрироваться</a>
            </p>
        </div>
    );
}

export default Login;