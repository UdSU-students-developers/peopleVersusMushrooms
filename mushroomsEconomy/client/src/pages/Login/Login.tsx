import React, { useState, useContext } from 'react';
import { IBasePage, PAGES } from '../PageManager';
import { ServerContext } from '../../App';
import './Login.css';

const Login: React.FC<IBasePage> = ({ setPage }) => {

    const server = useContext(ServerContext);

    const [login, setLogin] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const handleLogin = async (e: any) => {
        e.preventDefault();
        await server.login(login, password);
    };

    const goToRegister = () => {
        setPage(PAGES.REGISTRATION);
    };

    return (
        <div className="login-container">
            <h2>Вход</h2>

            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    placeholder="Введите логин"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button type="submit">
                    Войти
                </button>
            </form>

            <p className="login-switch" onClick={goToRegister}>
                Нет аккаунта? Зарегистрироваться
            </p>
        </div>
    );
};

export default Login;
