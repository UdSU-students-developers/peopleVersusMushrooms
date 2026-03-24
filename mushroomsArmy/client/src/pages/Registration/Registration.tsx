import React, { useState, useEffect, useContext } from "react";
import { MediatorContext, ServerContext } from "../../App";
import { PAGES } from '../PageManager';
import { validateLogin, validatePassword, validatePasswordMatch, validatePasswordNotLogin } from '../../utils/validation';
import './Registration.css';

const Registration: React.FC<{ setPage: (page: PAGES) => void }> = ({ setPage }) => {
    const server = useContext(ServerContext);
    const mediator = useContext(MediatorContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordRepeat, setPasswordRepeat] = useState('');
    const [errors, setErrors] = useState<{ username?: string; password?: string; passwordRepeat?: string; general?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const handleRegistrationSuccess = () => {
            setPage(PAGES.LOBBY);
        };

        const handleError = (error: { code: number; text: string }) => {
            setErrors({ general: error.text });
            setIsLoading(false);
        };

        mediator.subscribe(mediator.getEventTypes().USER_REGISTERED, handleRegistrationSuccess);
        mediator.subscribe(mediator.getEventTypes().SHOW_ERROR, handleError);

        return () => {
            mediator.unsubscribe(mediator.getEventTypes().USER_REGISTERED, handleRegistrationSuccess);
            mediator.unsubscribe(mediator.getEventTypes().SHOW_ERROR, handleError);
        };
    }, [mediator, setPage]);

    const validateField = (field: string, value: string) => {
        let error = '';
        if (field === 'username') {
            const validation = validateLogin(value);
            if (!validation.isValid) error = validation.error!;
        } else if (field === 'password') {
            const validation = validatePassword(value);
            if (!validation.isValid) error = validation.error!;
        } else if (field === 'passwordRepeat') {
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
        if (passwordRepeat) validateField('passwordRepeat', passwordRepeat);
    };

    const handlePasswordRepeatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPasswordRepeat(value);
        validateField('passwordRepeat', value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const usernameValidation = validateLogin(username);
        const passwordValidation = validatePassword(password);
        const matchValidation = validatePasswordMatch(password, passwordRepeat);
        const notLoginValidation = validatePasswordNotLogin(username, password);

        if (!usernameValidation.isValid || !passwordValidation.isValid || !matchValidation.isValid || !notLoginValidation.isValid) {
            setErrors({
                username: usernameValidation.error,
                password: passwordValidation.error || notLoginValidation.error,
                passwordRepeat: matchValidation.error,
            });
            return;
        }

        setIsLoading(true);
        server.register(username, password, passwordRepeat);
    };

    return (
        <div className="registration">
            <h1>Регистрация</h1>
            <div className="registration-form">
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
                    <label htmlFor="passwordRepeat">Подтверждение пароля</label>
                    <input
                        type="password"
                        id="passwordRepeat"
                        value={passwordRepeat}
                        onChange={handlePasswordRepeatChange}
                        className={errors.passwordRepeat ? 'error' : ''}
                    />
                    {errors.passwordRepeat && <span className="error-text">{errors.passwordRepeat}</span>}
                </div>
                {errors.general && <div className="error-general">{errors.general}</div>}
                <button type="submit" disabled={isLoading} className="register-btn" onClick={handleSubmit}>
                    {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>
            </div>
            <p className="login-link">
                Уже есть аккаунт? <a href="#" onClick={(e) => { e.preventDefault(); setPage(PAGES.LOGIN); }}>Войти</a>
            </p>
        </div>
    );
}

export default Registration;