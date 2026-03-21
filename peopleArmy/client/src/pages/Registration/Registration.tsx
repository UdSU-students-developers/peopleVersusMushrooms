import React, { useState, useEffect } from "react";
import { IBasePage, PAGES } from '../PageManager';
import { TUser } from '../../services/server/types';

const Registration: React.FC<IBasePage> = (props: IBasePage) => {
    const { server, setPage, store } = props;

    const [login, setLogin] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [isSuccess, setIsSuccess] = useState<boolean>(false);

    useEffect(() => {
        // Обновленный обработчик: теперь ждем данные пользователя (data.user)
        const onRegistrationResponse = (data: { result: string, user?: TUser }) => {
            if (data.result === 'ok' && data.user) {
                
                store.setUser(data.user);
                
                setMessage('Регистрация прошла успешно! Перенаправляем...');
                setIsSuccess(true);

                
                setTimeout(() => {
                    setPage(PAGES.CHAT);
                }, 1000);
            } else {
                setMessage('Ошибка: такой логин уже занят или данные неверны.');
                setIsSuccess(false);
            }
        };

        // Подписываемся на событие через наш обновленный Server.ts
        server.onRegistration(onRegistrationResponse);

        // Важно: отписываемся при размонтировании компонента, чтобы не было утечек
        return () => {
            server.offRegistration(onRegistrationResponse);
        };
    }, [server, store, setPage]);

    const handleRegister = () => {
        if (login && password) {
            setMessage('Отправка данных...');
            server.register(login, password);
        } else {
            setMessage('Пожалуйста, заполните все поля.');
        }
    };

    return (
        <div className="registration-container">
            <h2>Создать аккаунт</h2>

            {/* Твои инпуты */}
            <div className="form-group">
                <input type="text" placeholder="Логин" value={login} onChange={(e) => setLogin(e.target.value)} />
            </div>
            <div className="form-group">
                <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <button onClick={handleRegister} className="reg-button">Зарегистрироваться</button>

            {/* Кнопка возврата назад */}
            <button
                className="back-button"
                onClick={() => setPage(PAGES.LOGIN)}
            >
                Назад к входу
            </button>

            {message && <p className={`message ${isSuccess ? 'success' : 'error'}`}>{message}</p>}
        </div>
    );
}

export default Registration;