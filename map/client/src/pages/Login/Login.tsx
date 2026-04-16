import React, { useEffect, useRef, useState, useContext } from 'react';
import { MediatorContext, ServerContext } from "../../App";
import { IBasePage, PAGES } from '../PageManager';
import { TError } from '../../services/server/types';
import Button from '../../components/Button/Button';
import useCheckLogin from './hooks/useCheckLogin';
import './Login.scss'

const Login: React.FC<IBasePage> = (props) => {
    const { setPage } = props;
    const server = useContext(ServerContext);
    const mediator = useContext(MediatorContext);
    const loginRef = useRef<HTMLInputElement>(null!);
    const passwordRef = useRef<HTMLInputElement>(null!);
    const { isFormValid, clientError, setClientError, checkFilled, showError } = useCheckLogin();
    const [error, setError] = useState<TError | null>(null);
    const displayError = error?.message || clientError;

    const hideErrorOnInput = () => {
        setClientError('');
        checkFilled(loginRef.current.value, passwordRef.current.value);
    };

    const loginClickHandler = async () => {
        setError(null);
        const login = loginRef.current.value;
        const password = passwordRef.current.value;

        if (!showError(login, password)) return;
        server.login(login, password);
    }

    useEffect(() => {
        const { LOGIN } = mediator.getEventTypes();
        const { SHOW_ERROR } = mediator.getEventTypes();

        const loginHandler = () => {
            setError(null);
            setPage(PAGES.LOBBY);
        };

        const serverErrorHandler = (error: TError) => {
            setError(error);
        };

        mediator.subscribe(LOGIN, loginHandler);
        mediator.subscribe(SHOW_ERROR, serverErrorHandler);

        return () => {
            mediator.unsubscribe(LOGIN, loginHandler);
            mediator.unsubscribe(SHOW_ERROR, serverErrorHandler);
        };
    });

    const registrationClickHandler = () => { setPage(PAGES.REGISTRATION) };

    return (<div className='login'>
        <h1>КАРТА</h1>
        <h2>  🤸‍♂️</h2>
        <h1>🏌️🦽</h1>
        <div className="input-group login-group">
            <p className='p-login'>логин</p>
            <input
                ref={loginRef}
                type="text"
                placeholder="ваш логин"
                onChange={hideErrorOnInput}
                onKeyUp={() => checkFilled(loginRef.current.value, passwordRef.current.value)}
                className='input-login'
                id='test-input-login'
                autoComplete='off'
            />
        </div>

        <div className="input-group password-group">
            <p className='p-password'>пароль</p>
            <input
                ref={passwordRef}
                type="password"
                placeholder="ваш пароль"
                onChange={hideErrorOnInput}
                onKeyUp={() => checkFilled(loginRef.current.value, passwordRef.current.value)}
                className='input-password'
                id='test-input-password'
                autoComplete='off'
            />
        </div>

        {displayError && <p id='test-errors-login' className='errors'>{displayError}</p>}
        <Button
            onClick={loginClickHandler}
            text='войти'
            isDisabled={!isFormValid}
            className='button-login'
            id='test-button-login'
        />
        <Button
            onClick={registrationClickHandler}
            text='создать учетную запись'
            className='button-registration'
            id='test-button-registration'
        />
    </div>)
}

export default Login;