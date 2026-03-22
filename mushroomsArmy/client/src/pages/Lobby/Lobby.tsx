import React from "react";
import { IBasePage } from '../PageManager';
import './Lobby.css';

const Lobby: React.FC<IBasePage> = (props: IBasePage) => {
    return (
        <div className="lobby">
            <h1>Лобби</h1>
            <p>Добро пожаловать в лобби армии грибов!</p>
            {/* Здесь можно добавить кнопки для начала игры и т.д. */}
        </div>
    );
}

export default Lobby;