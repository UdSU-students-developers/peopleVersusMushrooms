import React, { useState } from "react";
import { IBasePage, PAGES } from '../PageManager';
import './Login.css';

const Login: React.FC<IBasePage> = (props: IBasePage) => {

    return (
        <div>
            <p>Login</p>
            <button onClick={() => props.setPage(PAGES.SOCKET_CHAT)}>
                Перейти к тестовому сокет чату
            </button>
        </div>
    );
}

export default Login;