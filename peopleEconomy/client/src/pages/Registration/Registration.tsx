import React, { useContext, useEffect, useRef, useState } from 'react';
import { MediatorContext, ServerContext } from "../../App";
import { IBasePage,  PAGES } from '../PageManager';
import { TError } from '../../services/server/types';
import Button from '../../components/Button/Button';
import useChecRegistration from './hooks/useCheckRegistration';
import './Registration.scss';

const Registration: React.FC<IBasePage> = (props) => {
    const { setPage } = props;
    const mediator = useContext(MediatorContext);
    const server = useContext(ServerContext);
    const loginRef = useRef<HTMLInputElement>(null!);
    const passwordRef = useRef<HTMLInputElement>(null!);
    const confirmPasswordRef = useRef<HTMLInputElement>(null!);
    const { isFormValid, clientError, setClientError, checkFilled, showError } = useChecRegistration();
    const [error, setError] = useState<TError | null>(null);
    const displayError = error?.message || clientError;

    const hideErrorOnInput = () => {
        setClientError('');
        checkFilled(loginRef.current.value, passwordRef.current.value, confirmPasswordRef.current.value);
    };

    const registrationClickHandler = async () => {
        setError(null);
        const login = loginRef.current.value;
        const password = passwordRef.current.value;
        const confirmPassword = confirmPasswordRef.current.value;

        if (!showError(login, password, confirmPassword)) return;

        server.registration(login, password);
    }

    useEffect(() => {
        const { REGISTRATION } = mediator.getEventTypes();
        const { SHOW_ERROR } = mediator.getEventTypes();

        const registrationHandler = () => {
            setError(null);
            setPage(PAGES.LOGIN);
        };

        const serverErrorHandler = (error: TError) => {
            setError(error);
        };

        mediator.subscribe(REGISTRATION, registrationHandler);
        mediator.subscribe(SHOW_ERROR, serverErrorHandler);

        return () => {
            mediator.unsubscribe(REGISTRATION, registrationHandler);
            mediator.unsubscribe(SHOW_ERROR, serverErrorHandler);
        };
    });

    const haveAccountClickHandler = () => {
        setPage(PAGES.LOGIN)
    }

    return (<div className='registration'>
        <div className='registration-wrapper'>
            <p className='registration-label-log'>логин</p>
            <input
                ref={loginRef}
                type="text"
                placeholder="ваш логин"
                onChange={hideErrorOnInput}
                onKeyUp={() => checkFilled(loginRef.current.value, passwordRef.current.value, confirmPasswordRef.current.value)}
                className='input-loginReg'
                id='test-input-loginReg'
                autoComplete='off'
            />
            <p className='registration-label-pass'>пароль</p>
            <input
                ref={passwordRef}
                type="password"
                placeholder="ваш пароль"
                onChange={hideErrorOnInput}
                onKeyUp={() => checkFilled(loginRef.current.value, passwordRef.current.value, confirmPasswordRef.current.value)}
                className='input-passwordReg'
                id='test-input-passwordReg'
                autoComplete='off'
            />
            <p className='registration-label-certpass'>подтверждение пароля</p>
            <input
                ref={confirmPasswordRef}
                type="password"
                placeholder="повторите ваш пароль"
                onChange={hideErrorOnInput}
                onKeyUp={() => checkFilled(loginRef.current.value, passwordRef.current.value, confirmPasswordRef.current.value)}
                className='input-certpasswordReg'
                id='test-input-certpasswordReg'
                autoComplete='off'
            />
            <div>
            </div>
            {displayError && <div id='test-errors-registration' className='errors'>{displayError}</div>}
            <div className='registration-buttons'>
                <Button
                    onClick={registrationClickHandler}
                    text='зарегистрироваться'
                    isDisabled={!isFormValid}
                    className='registration-button'
                    id='test-registration-button'
                />
                <Button
                    onClick={haveAccountClickHandler}
                    text='есть аккаунт?'
                    className='haveAccount-Button'
                    id='test-haveAccount-Button'
                />
            </div>
        </div>
    </div>)
}

export default Registration;