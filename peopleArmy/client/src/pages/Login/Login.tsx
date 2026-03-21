import React, { useState, useEffect } from "react";
import { IBasePage, PAGES } from '../PageManager';
import { TUser } from '../../services/server/types';

const Login: React.FC<IBasePage> = (props: IBasePage) => {
    const { server, setPage, store } = props;

    const [login, setLogin] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [isSuccess, setIsSuccess] = useState<boolean>(false);

    useEffect(() => {
        // Проверяем, есть ли уже сохраненный пользователь
        const savedUser = store.getUser();
        if (savedUser) {
            // Если пользователь уже авторизован, сразу переходим в чат
            setPage(PAGES.CHAT);
        }

        // Обработчик ответа от сервера
        const onLoginResponse = (data: { result: string, user?: TUser }) => {
            if (data.result === 'ok' && data.user) {
                // Сохраняем данные в Store
                store.setUser(data.user);
                
                setMessage('Вход выполнен! Перенаправляем...');
                setIsSuccess(true);

                // Переходим в чат
                setTimeout(() => {
                    setPage(PAGES.CHAT);
                }, 1000);
            } else {
                setMessage('Ошибка: неверный логин или пароль.');
                setIsSuccess(false);
            }
        };

        server.onLogin(onLoginResponse);

        return () => {
            server.offLogin(onLoginResponse);
        };
    }, [server, store, setPage]);

    const handleLogin = () => {
        if (login && password) {
            setMessage('Авторизация...');
            server.login(login, password);
        } else {
            setMessage('Пожалуйста, заполните все поля.');
        }
    };

    return (
        <div className="login-container">
            <h2>Вход</h2>

            <div className="form-group">
                <input 
                    type="text" 
                    placeholder="Логин" 
                    value={login} 
                    onChange={(e) => setLogin(e.target.value)} 
                />
            </div>
            <div className="form-group">
                <input 
                    type="password" 
                    placeholder="Пароль" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                />
            </div>

            <button onClick={handleLogin} className="login-button">Войти</button>

            <button
                className="secondary-button"
                onClick={() => setPage(PAGES.REGISTRATION)}
            >
                Нет аккаунта? Зарегистрироваться
            </button>

            {message && <p className={`message ${isSuccess ? 'success' : 'error'}`}>{message}</p>}
        </div>
    );
}

export default Login;