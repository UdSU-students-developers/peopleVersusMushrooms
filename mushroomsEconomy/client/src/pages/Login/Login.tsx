import React, { useState, useContext, useEffect } from 'react';
import { IBasePage, PAGES } from '../PageManager';
import { MediatorContext, ServerContext } from '../../App';
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
            <h2>{isForgotMode ? 'Восстановление доступа' : 'Вход'}</h2>

            <div className="login-form">
                <input
                    id="testing-login-username"
                    type="text"
                    placeholder="Введите логин"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                />

                {!isForgotMode && (
                    <>
                        <input
                            id="testing-login-password"
                            type="password"
                            placeholder="Введите пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                <div id="testing-login-errors" className="error-box" style={{ color: 'red', fontSize: '0.9em' }}>
                    {errors.map((err, idx) => <div key={idx}>{err}</div>)}
                </div>

                <div className="checkbox-container">
                    <input
                        type="checkbox"
                        id="testing-login-disable-checks"
                        checked={disableChecks}
                        onChange={() => setDisableChecks(!disableChecks)}
                    />
                    <label htmlFor="testing-login-disable-checks">Отключить проверки</label>
                </div>

                <button
                    id="testing-login-submit"
                    type="button"
                    onClick={handleSubmit}
                    disabled={!disableChecks && errors.length > 0}
                >
                    {isForgotMode ? 'Восстановить' : 'Войти'}
                </button>
            </div>

            <div className="links-section">
                <p
                    className="link-style"
                    onClick={() => {
                        setIsForgotMode(!isForgotMode);
                        setErrors([]);
                    }}
                    style={{ cursor: 'pointer', color: '#007bff' }}
                >
                    {isForgotMode ? 'Вспомнили пароль? Войти' : 'Забыли пароль?'}
                </p>

                {!isForgotMode && (
                    <p
                        id="testing-login-switch-to-register"
                        className="login-switch"
                        onClick={switchToRegister}
                        style={{ cursor: 'pointer' }}
                    >
                        Нет аккаунта? Зарегистрироваться
                    </p>
                )}
            </div>
        </div>
    );
};

export default Login;
