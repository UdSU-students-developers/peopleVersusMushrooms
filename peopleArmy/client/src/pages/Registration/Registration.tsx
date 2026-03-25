import React, { useEffect, useState } from "react";
import { io, Socket } from 'socket.io-client';
import { IBasePage, PAGES } from '../PageManager';
import CONFIG from '../../config';
import './Registration.css';

const Registration: React.FC<IBasePage> = (props: IBasePage) => {
    const { setPage, mediator } = props;
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const client = io(CONFIG.SERVER_URL);
        setSocket(client);

        client.on(CONFIG.SOCKET.REGISTRATION, (response: any) => {
            if (response.result === 'ok') {
                const userData = response?.data ?? null;
                const token = userData?.token ?? null;
                mediator.get(CONFIG.MEDIATOR.TRIGGERS.SET_STORE, { name: 'user', value: userData });
                mediator.get(CONFIG.MEDIATOR.TRIGGERS.SET_STORE, { name: 'token', value: token });
                setPage(PAGES.ARMY);
                return;
            }
            setError(response.error || 'Ошибка регистрации');
        });

        return () => {
            client.off(CONFIG.SOCKET.REGISTRATION);
            client.disconnect();
            setSocket(null);
        };
    }, [setPage, mediator]);

    const register = () => {
        setError('');
        socket?.emit(CONFIG.SOCKET.REGISTRATION, {
            name: name.trim(),
            password: password.trim(),
        });
    };

    return (
        <div className="registration-page">
            <div className="registration-card">
                <h1 className="registration-title">Регистрация</h1>
                <p className="registration-subtitle">Создайте аккаунт для доступа к чату</p>
                <div className="registration-form">
                    <div>
                        <label className="registration-label" htmlFor="reg-name">Имя</label>
                        <input
                            id="reg-name"
                            className="registration-input"
                            autoComplete="username"
                            placeholder="Придумайте логин"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="registration-label" htmlFor="reg-password">Пароль</label>
                        <input
                            id="reg-password"
                            className="registration-input"
                            type="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="registration-actions">
                        <button type="button" className="registration-btn registration-btn-primary" onClick={register}>
                            Зарегистрироваться
                        </button>
                        <button type="button" className="registration-btn registration-btn-secondary" onClick={() => props.setPage(PAGES.LOGIN)}>
                            У меня уже есть аккаунт
                        </button>
                    </div>
                </div>
                {error ? <p className="registration-error" role="alert">{error}</p> : null}
            </div>
        </div>
    );
}

export default Registration;