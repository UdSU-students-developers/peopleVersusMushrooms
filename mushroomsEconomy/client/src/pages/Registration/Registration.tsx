import React, { useState, useContext, useEffect } from 'react';
import { IBasePage, PAGES } from '../PageManager';
import { MediatorContext, ServerContext} from '../../App';
import './Registration.css';

const Registration: React.FC<IBasePage> = ({ setPage }) => {
    const server = useContext(ServerContext);
    const mediator = useContext(MediatorContext);

    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [name, setName] = useState<string>('');

    useEffect(() => {
            if (!mediator) return;
    
            const eventTypes = mediator.getEventTypes();
    
            const handleRegister = () => {
                setPage(PAGES.GAME);
            }
    
            mediator.subscribe(eventTypes.REGISTRATION, handleRegister);
    
            return () => {
                mediator.unsubscribe(eventTypes.REGISTRATION, handleRegister);
            }
    }, [mediator, setPage]);

    const handleRegister = async () => {
        if (!name || !password || !confirmPassword) {
            alert('Заполните все поля');
            return;
        }
        if (password !== confirmPassword) {
            alert('Пароли не совпадают');
            return;
        }
        await server.register(name, password);
    };

    return (
        <div className="registration-container">
            <h2>Создание аккаунта</h2>
            <div className="registration-form">
                <input
                    id="testing-registration-name"
                    placeholder="Логин"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <input
                    id="testing-registration-password"
                    type="password"
                    placeholder="Придумайте пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <input
                    id="testing-registration-confirm-password"
                    type="password"
                    placeholder="Подтвердите пароль"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <button id="testing-registration-submit" type="button" onClick={handleRegister}>
                    Зарегистрироваться
                </button>
            </div>

            <p
                id="testing-registration-switch-to-login"
                className="registration-switch"
                onClick={() => setPage(PAGES.LOGIN)}
            >
                Уже есть аккаунт? Войти
            </p>
        </div>
    );
};

export default Registration;