import React, { useContext } from "react";
import { MediatorContext, ServerContext } from "../../App";
import { PAGES } from '../PageManager';
import './Lobby.css';

const Lobby: React.FC<{ setPage: (page: PAGES) => void }> = ({ setPage }) => {
    const server = useContext(ServerContext);
    const mediator = useContext(MediatorContext);

    const handleLogout = () => {
        server.logout();
        setPage(PAGES.LOGIN);
    };

    const handleStartGame = () => {
        // Переход на экран игры
        setPage(PAGES.CHAT); // Предполагаем, что CHAT - это игра
    };

    return (
        <div className="lobby">
            <h1>Лобби</h1>
            <p>Добро пожаловать в лобби армии грибов!</p>
            <button onClick={handleStartGame}>Начать игру</button>
            <button onClick={handleLogout}>Выйти</button>
        </div>
    );
}

export default Lobby;