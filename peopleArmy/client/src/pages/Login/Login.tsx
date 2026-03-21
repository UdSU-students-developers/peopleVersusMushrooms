import React from "react";
import { IBasePage, PAGES } from '../PageManager';
import './Login.css';

const Login: React.FC<IBasePage> = (props: IBasePage) => {

    return (
        <div>
            <p>Login</p>
            <button onClick={() => props.setPage(PAGES.CHAT)}>
                Перейти к чату через сокеты
            </button>
        </div>
    );
}

export default Login;