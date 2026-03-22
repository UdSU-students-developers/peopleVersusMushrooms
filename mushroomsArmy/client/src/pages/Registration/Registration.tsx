import React, { useState, useEffect } from "react";
import { IBasePage, PAGES } from '../PageManager';
import { validateLogin, validatePassword, validatePasswordMatch, validatePasswordNotLogin } from '../../utils/validation';
import './Registration.css';

const Registration: React.FC<IBasePage> = ({ setPage, server }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{ username?: string; password?: string; confirmPassword?: string; general?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const handleRegistrationSuccess = () => {
            setPage(PAGES.LOBBY);
        };

        const handleError = (error: { code: number; text: string }) => {
            setErrors({ general: error.text });
            setIsLoading(false);
        };

        server.mediator.subscribe(server.mediator.getEventTypes().USER_REGISTERED, handleRegistrationSuccess);
        server.showError(handleError);

        return () => {
            server.mediator.unsubscribe(server.mediator.getEventTypes().USER_REGISTERED, handleRegistrationSuccess);
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
        } else if (field === 'confirmPassword') {
            const validation = validatePasswordMatch(password, value);
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
        if (confirmPassword) validateField('confirmPassword', confirmPassword);
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setConfirmPassword(value);
        validateField('confirmPassword', value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const usernameValidation = validateLogin(username);
        const passwordValidation = validatePassword(password);
        const matchValidation = validatePasswordMatch(password, confirmPassword);
        const notLoginValidation = validatePasswordNotLogin(username, password);

        if (!usernameValidation.isValid || !passwordValidation.isValid || !matchValidation.isValid || !notLoginValidation.isValid) {
            setErrors({
                username: usernameValidation.error,
                password: passwordValidation.error || notLoginValidation.error,
                confirmPassword: matchValidation.error,
            });
            return;
        }

        setIsLoading(true);
        const success = await server.register(username, password, confirmPassword);
        if (!success) {
            setIsLoading(false);
        }
    };

    return (
        <div className="registration">
            <h1>Регистрация</h1>
            <form onSubmit={handleSubmit} className="registration-form">
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
                <div className="form-group">
                    <label htmlFor="confirmPassword">Подтверждение пароля</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        className={errors.confirmPassword ? 'error' : ''}
                    />
                    {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>
                {errors.general && <div className="error-general">{errors.general}</div>}
                <button type="submit" disabled={isLoading} className="register-btn">
                    {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>
            </form>
            <p className="login-link">
                Уже есть аккаунт? <a href="#" onClick={(e) => { e.preventDefault(); setPage(PAGES.LOGIN); }}>Войти</a>
            </p>
        </div>
    );
}

export default Registration;