import React, { useState, useContext } from 'react';
import { IBasePage, PAGES } from '../PageManager';
import { ServerContext} from '../../App';
import './Registration.css';

const Registration: React.FC<IBasePage> = ({ setPage }) => {
    const server = useContext(ServerContext);

    const [password, setPassword] = useState<string>('');
    const [name, setName] = useState<string>('');

    const handleRegister = async (e: any) => {
        e.preventDefault();
        await server.register(name, password);
    };

    return (
        <div className="registration-container">
            <h2>Создание аккаунта</h2>

            <form onSubmit={handleRegister}>
                <input
                    placeholder="Ваше имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Придумайте пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button type="submit">
                    Зарегистрироваться
                </button>
            </form>

            <p
                className="switch-mode"
                onClick={() => setPage(PAGES.LOGIN)}
            >
                Уже есть аккаунт? Войти
            </p>
        </div>
    );
};

export default Registration;
