import React, { useState, useContext, useEffect } from 'react';
import { IBasePage, PAGES } from '../PageManager';
import { MediatorContext, ServerContext } from '../../App';
import Button from '../../components/Button/Button';
import './Login.css';

const Login: React.FC<IBasePage> = ({ setPage }) => {
    const server = useContext(ServerContext);
    const mediator = useContext(MediatorContext);

    const [login, setLogin] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [rememberMe, setRememberMe] = useState<boolean>(false);
    const [disableChecks, setDisableChecks] = useState<boolean>(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [isForgotMode, setIsForgotMode] = useState<boolean>(false);

    useEffect(() => {
        if (!mediator) return;
        const eventTypes = mediator.getEventTypes();
        const handleLogin = () => setPage(PAGES.START_GAME);
        mediator.subscribe(eventTypes.LOGIN, handleLogin);
        return () => mediator.unsubscribe(eventTypes.LOGIN, handleLogin);
    }, [mediator, setPage]);

    useEffect(() => {
        if (disableChecks) {
            setErrors([]);
            return;
        }
        const errs = [];
        if (!login) errs.push('Введите логин');
        if (!isForgotMode && !password) errs.push('Введите пароль');
        setErrors(errs);
    }, [login, password, isForgotMode, disableChecks]);

    const handleSubmit = async () => {
        if (!disableChecks && errors.length > 0) return;

        if (isForgotMode) {
            alert(`Инструкция по восстановлению отправлена для логина: ${login}`);
            setIsForgotMode(false);
            return;
        }

        await server.login(login, password);
    };

    const switchToRegister = () => {
        setPage(PAGES.REGISTRATION);
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>{isForgotMode ? 'Восстановление' : 'Вход'}</h2>

                <div className="login-form">
                    <input
                        id="testing-login-username"
                        type="text"
                        placeholder="Логин"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        className="pixel-input"
                    />

                    {!isForgotMode && (
                        <>
                            <input
                                id="testing-login-password"
                                type="password"
                                placeholder="Пароль"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pixel-input"
                            />

                            <div className="checkbox-container">
                                <input
                                    type="checkbox"
                                    id="testing-login-remember"
                                    checked={rememberMe}
                                    onChange={() => setRememberMe(!rememberMe)}
                                />
                                <label htmlFor="testing-login-remember">Запомнить меня</label>
                            </div>
                        </>
                    )}
                    
                    {errors.length > 0 && (
                        <div className="error-box">
                            {errors.map((err, idx) => <div key={idx}>{err}</div>)}
                        </div>
                    )}

                    <div className="checkbox-container">
                        <input
                            type="checkbox"
                            id="testing-login-disable-checks"
                            checked={disableChecks}
                            onChange={() => setDisableChecks(!disableChecks)}
                        />
                        <label htmlFor="testing-login-disable-checks">Отключить проверки</label>
                    </div>

                    <Button 
                        onClick={handleSubmit}
                        text={isForgotMode ? 'Восстановить' : 'Войти'}
                        variant="primary"
                        isDisabled={!disableChecks && errors.length > 0}
                        className="login-btn"
                    />
                </div>

                <div className="links-section">
                    <p className="link-style" onClick={() => { setIsForgotMode(!isForgotMode); setErrors([]); }}>
                        {isForgotMode ? 'Вспомнили пароль? Войти' : 'Забыли пароль?'}
                    </p>

                    {!isForgotMode && (
                        <p className="link-style" onClick={switchToRegister}>
                            Нет аккаунта? Зарегистрироваться
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
