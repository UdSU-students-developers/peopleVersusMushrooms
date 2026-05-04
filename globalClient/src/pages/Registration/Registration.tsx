import React, { useState, useContext, useEffect } from 'react';
import { IBasePage, PAGES } from '../PageManager';
import { MediatorContext, ServerContext } from '../../App';
import Button from '../../components/Button/Button';
import './Registration.css';

const Registration: React.FC<IBasePage> = ({ setPage }) => {
    const server = useContext(ServerContext);
    const mediator = useContext(MediatorContext);

    const [login, setLogin] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [displayName, setDisplayName] = useState<string>('');
    const [errors, setErrors] = useState<string[]>([]);
    const [isFormValid, setIsFormValid] = useState<boolean>(false);
    const [disableChecks, setDisableChecks] = useState<boolean>(false);

    useEffect(() => {
        if (!mediator) return;
        const eventTypes = mediator.getEventTypes();
        const handleRegister = () => setPage(PAGES.START_GAME);
        mediator.subscribe(eventTypes.REGISTRATION, handleRegister);
        return () => mediator.unsubscribe(eventTypes.REGISTRATION, handleRegister);
    }, [mediator, setPage]);

    useEffect(() => {
        if (disableChecks) {
            setErrors([]);
            setIsFormValid(true);
            return;
        }

        const currentErrors: string[] = [];

        if (!login) {
            currentErrors.push('Введите логин');
        } else {
            if (login.length < 5 || login.length > 20) currentErrors.push('Логин: 5-20 символов');
            if (!/^[a-zA-Z]/.test(login)) currentErrors.push('Логин: с буквы');
            if (!/^[a-zA-Z0-9_]+$/.test(login)) currentErrors.push('Логин: a-z, 0-9, _');
            if (login === password) currentErrors.push('Логин != Пароль');
        }

        if (!password) {
            currentErrors.push('Введите пароль');
        } else {
            if (password.length < 8) currentErrors.push('Пароль: мин 8 символов');
            if (!/[A-Z]/.test(password)) currentErrors.push('Пароль: нужна заглавная');
            if (!/[a-z]/.test(password)) currentErrors.push('Пароль: нужна строчная');
            if (!/[0-9]/.test(password)) currentErrors.push('Пароль: нужна цифра');
        }

        if (!confirmPassword) currentErrors.push('Подтвердите пароль');
        else if (password !== confirmPassword) currentErrors.push('Пароли не совпадают');

        if (!displayName) currentErrors.push('Введите имя');

        setErrors(currentErrors);
        setIsFormValid(currentErrors.length === 0);

    }, [login, password, confirmPassword, displayName, disableChecks]);

    const handleRegister = async () => {
        if (!disableChecks && !isFormValid) return;
        await server.register(login, password);
    };

    return (
        <div className="registration-container">
            <div className="registration-box">
                <h2>Регистрация</h2>

                <div className="registration-form">
                    <input
                        id="testing-registration-name"
                        placeholder="Логин"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        className="pixel-input"
                    />

                    <input
                        id="testing-registration-password"
                        type="password"
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pixel-input"
                    />

                    <input
                        id="testing-registration-confirm-password"
                        type="password"
                        placeholder="Повтор пароля"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pixel-input"
                    />

                    <input
                        id="testing-registration-display-name"
                        type="text"
                        placeholder="Имя игрока"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="pixel-input"
                    />

                    {errors.length > 0 && (
                         <div id="testing-registration-errors" className="error-box">
                             {errors.map((err, idx) => <div key={idx}>{err}</div>)}
                         </div>
                    )}

                    <div className="checkbox-container">
                        <input
                            type="checkbox"
                            id="testing-registration-disable-checks"
                            checked={disableChecks}
                            onChange={() => setDisableChecks(!disableChecks)}
                        />
                        <label htmlFor="testing-registration-disable-checks">Отключить проверки</label>
                    </div>

                    <Button 
                        id="testing-registration-submit"
                        onClick={handleRegister}
                        text="Создать"
                        variant="primary"
                        isDisabled={!disableChecks && !isFormValid}
                        className="register-btn"
                    />
                </div>

                <p className="link-style" onClick={() => setPage(PAGES.LOGIN)}>
                    Уже есть аккаунт? Войти
                </p>
            </div>
        </div>
    );
};

export default Registration;