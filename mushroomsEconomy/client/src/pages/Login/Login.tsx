import React, { useState, useContext, useEffect } from 'react';
import { IBasePage, PAGES } from '../PageManager';
import { MediatorContext, ServerContext } from '../../App';
import './Login.css';

const Login: React.FC<IBasePage> = ({ setPage }) => {

    const server = useContext(ServerContext);
    const mediator = useContext(MediatorContext);

    const [login, setLogin] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    useEffect(() => {
        if (!mediator) return;

        const eventTypes = mediator.getEventTypes();

        const handleLogin = () => {
            setPage(PAGES.GAME);
        }

        mediator.subscribe(eventTypes.LOGIN, handleLogin);

        return () => {
            mediator.unsubscribe(eventTypes.LOGIN, handleLogin);
        }
    }, [mediator, setPage]);

    const handleLogin = async () => {
        if (!login || !password) {
            alert('Введите логин и пароль');
            return;
        }
        await server.login(login, password);
    };

    const goToRegister = () => {
        setPage(PAGES.REGISTRATION);
    };

    return (
        <div className="login-container">
            <h2>Вход</h2>
            <div className="login-form">
                <input
                    id="testing-login-username"
                    type="text"
                    placeholder="Введите логин"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                />

                <input
                    id="testing-login-password"
                    type="password"
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button id="testing-login-submit" type="button" onClick={handleLogin}>
                    Войти
                </button>
            </div>

            <p id="testing-login-switch-to-register" className="login-switch" onClick={goToRegister}>
                Нет аккаунта? Зарегистрироваться
            </p>
        </div>
    );
};

export default Login;
