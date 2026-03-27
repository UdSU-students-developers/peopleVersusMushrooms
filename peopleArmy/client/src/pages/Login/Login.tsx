import React, { useEffect, useState } from "react";
import { io, Socket } from 'socket.io-client';
import { IBasePage, PAGES } from '../PageManager';
import CONFIG from '../../config';
import './Login.css';

const Login: React.FC<IBasePage> = (props: IBasePage) => {
    const { setPage, mediator } = props;
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const client = io(CONFIG.SERVER_URL);
        setSocket(client);

        client.on(CONFIG.SOCKET.LOGIN, (response: any) => {
            if (response.result === 'ok') {
                const userData = response?.data ?? null;
                const token = userData?.token ?? null;
                mediator.get(CONFIG.MEDIATOR.TRIGGERS.SET_STORE, { name: 'user', value: userData });
                mediator.get(CONFIG.MEDIATOR.TRIGGERS.SET_STORE, { name: 'token', value: token });
                setPage(PAGES.CHAT);
                return;
            }
            setError(response.error || 'Ошибка входа');
        });

        return () => {
            client.off(CONFIG.SOCKET.LOGIN);
            client.disconnect();
            setSocket(null);
        };
    }, [setPage, mediator]);

    const login = () => {
        setError('');
        socket?.emit(CONFIG.SOCKET.LOGIN, {
            name: name.trim(),
            password: password.trim(),
        });
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <h1 className="login-title">Вход</h1>
                <p className="login-subtitle">Войдите, чтобы перейти в чат</p>
                <div className="login-form">
                    <div>
                        <label className="login-label" htmlFor="login-name">Имя</label>
                        <input
                            id="login-name"
                            className="login-input"
                            autoComplete="username"
                            placeholder="Ваш логин"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="login-label" htmlFor="login-password">Пароль</label>
                        <input
                            id="login-password"
                            className="login-input"
                            type="password"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="login-actions">
                        <button type="button" className="login-btn login-btn-primary" onClick={login}>
                            Войти
                        </button>
                        <button type="button" className="login-btn login-btn-secondary" onClick={() => props.setPage(PAGES.REGISTRATION)}>
                            Регистрация
                        </button>
                    </div>
                </div>
                {error ? <p className="login-error" role="alert">{error}</p> : null}
            </div>
        </div>
    );
}

export default Login;