import React, { useContext, useEffect, useState } from "react";
import CONFIG from "../../config";
import { MediatorContext, ServerContext } from "../../App";
import { TLobbies, TUser } from "../../services/Server/types";
import { IBasePage, PAGES } from "../PageManager";

import "./StartGame.css";

const StartGame: React.FC<IBasePage> = ({ setPage }) => {
    const server = useContext(ServerContext);
    const mediator = useContext(MediatorContext);
    const [lobbies, setLobbies] = useState<TLobbies>([]);
    const { GET_STORE } = CONFIG.MEDIATOR.TRIGGERS;
    const EVENTS = mediator.getEventTypes();
    const user = mediator.get<TUser | null>(GET_STORE, 'user');

    useEffect(() => {
        const handleStartGame = () => setPage(PAGES.GAME);
        const handleLobbyUpdated = (data: TLobbies) => setLobbies(data);

        mediator.subscribe(EVENTS.START_GAME, handleStartGame);
        mediator.subscribe(EVENTS.LOBBY_UPDATED, handleLobbyUpdated);

        return () => {
            mediator.unsubscribe(EVENTS.START_GAME, handleStartGame);
            mediator.unsubscribe(EVENTS.LOBBY_UPDATED, handleLobbyUpdated);
        };
    });

    const handleJoinToLobby = () => {
        server.joinToLobby(lobbies[0].lobbyGuid);
    }
    const handleStartGame = () => server.createLobby();
    const handleBackToLogin = () => setPage(PAGES.LOGIN);

    return (
        <div className="start-game-page">
            <div className="start-game-container">
                <h2>Лобби</h2>
                <div className="player-info-block">
                    {user ? (
                        <>
                            <div className="info-row">
                                <span className="info-label">Игрок:</span>
                                <span className="info-value">{user.name}</span>
                            </div>
                            <div>
                                <span className="info-label">Socket ID:</span>
                                <span className="info-value socket-id">{user.guid}</span>
                            </div>
                        </>
                    ) : (
                        <div className="info-loading">Загрузка данных...</div>
                    )}
                </div>
                <div className="start-game-actions">
                    <button onClick={handleJoinToLobby}>
                        Присоединиться к лобби
                    </button>
                    <button id="testing-start-game" onClick={handleStartGame}>
                        Создать лобби и начать игру
                    </button>
                    <button className="back-button" id="testing-back-to-game" onClick={handleBackToLogin}>
                        Назад
                    </button>
                </div>
            </div>
        </div>
    )
}

export default StartGame;