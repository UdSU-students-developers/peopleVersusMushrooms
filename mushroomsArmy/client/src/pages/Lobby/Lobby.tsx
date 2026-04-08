import React, { useContext, useEffect } from "react";
import { MediatorContext, ServerContext } from "../../App";
import { PAGES } from '../PageManager';
import { authStorage } from "../../utils/authStorage";
import './Lobby.css';

const Lobby: React.FC<{ setPage: (page: PAGES) => void }> = ({ setPage }) => {
    const server = useContext(ServerContext);
    const mediator = useContext(MediatorContext);

    const GET_STORE = mediator.getTriggerTypes().GET_STORE;
    const { USER_LOGGED_OUT, GAME_STARTED } = mediator.getEventTypes();

    const user = mediator.get(GET_STORE, 'user');

    useEffect(() => {
        const handleLoggedOut = () => {
            authStorage.clearAuth();
            setPage(PAGES.LOGIN);
        };

        const handleGameStarted = () => {
            setPage(PAGES.GAME);
        };

        mediator.subscribe(USER_LOGGED_OUT, handleLoggedOut);
        mediator.subscribe(GAME_STARTED, handleGameStarted);

        return () => {
            mediator.unsubscribe(USER_LOGGED_OUT, handleLoggedOut);
            mediator.unsubscribe(GAME_STARTED, handleGameStarted);
        };
    }, [mediator, setPage, USER_LOGGED_OUT, GAME_STARTED]);

    const handleLogout = () => {
        server.logout();
    };

    const handleStartGame = () => {
        server.lobbyStart();
    };

    return (
        <div className="lobby">
            <header className="lobby__header">
                <div className="lobby__userBlock">
                    <span className="lobby__username">
                        {user?.name || user?.username || "Игрок"}
                    </span>

                    <button
                        className="lobby__logoutButton"
                        onClick={handleLogout}
                    >
                        Выход
                    </button>
                </div>
            </header>

            <main className="lobby__content">
                <h1 className="lobby__title">Лобби</h1>
                <p className="lobby__subtitle">
                    Добро пожаловать в лобби армии грибов!
                </p>

                <button
                    className="lobby__startButton"
                    onClick={handleStartGame}
                >
                    Начать игру
                </button>
            </main>
        </div>
    );
};

export default Lobby;