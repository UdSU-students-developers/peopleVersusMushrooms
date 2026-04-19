import React, { useContext, useEffect, useState } from "react";
import CONFIG from "../../config";
import { MediatorContext, ServerContext } from "../../App";
import { TLobbies, TLobby, TUser } from "../../services/Server/types";
import { IBasePage, PAGES } from "../PageManager";

import "./StartGame.css";

const Lobby: React.FC<IBasePage> = ({ setPage }) => {
    const server = useContext(ServerContext);
    const mediator = useContext(MediatorContext);

    const [lobbies, setLobbies] = useState<TLobbies>([]);
    const [currentLobby, setCurrentLobby] = useState<TLobby | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const [lobbyNameInput, setLobbyNameInput] = useState<string>("");

    const { GET_STORE } = CONFIG.MEDIATOR.TRIGGERS;
    const EVENTS = mediator.getEventTypes();
    const user = mediator.get<TUser | null>(GET_STORE, 'user');

    useEffect(() => {
        const handleLobbiesList = (list: TLobbies) => {
            console.log('Получен список лобби:', list);
            setLobbies(list);
            setError(null);
        };

        const handleLobbyUpdate = (lobby: TLobby | null) => {
            console.log('Обновление лобби:', lobby);
            setCurrentLobby(lobby);
            setError(null);
        };

        const handleStartGame = () => {
            console.log('Игра начинается!');
            setPage(PAGES.GAME);
        };

        const handleError = (err: any) => {
            console.error('Ошибка:', err);
            setError(err?.text || 'Неизвестная ошибка');
        };

        mediator.subscribe(EVENTS.LOBBIES_LIST_UPDATED, handleLobbiesList);
        mediator.subscribe(EVENTS.LOBBY_UPDATED, handleLobbyUpdate);
        mediator.subscribe(EVENTS.START_GAME, handleStartGame);
        mediator.subscribe(EVENTS.SHOW_ERROR, handleError); 

        server.getLobbies();

        return () => {
            mediator.unsubscribe(EVENTS.LOBBIES_LIST_UPDATED, handleLobbiesList);
            mediator.unsubscribe(EVENTS.LOBBY_UPDATED, handleLobbyUpdate);
            mediator.unsubscribe(EVENTS.START_GAME, handleStartGame);
            mediator.unsubscribe(EVENTS.SHOW_ERROR, handleError);
        };
    }, [mediator, server, setPage]);


    const handleCreateLobby = () => {
        setError(null);
        const nameToSend = lobbyNameInput.trim() || `${user?.name || 'Player'}'s Lobby`;
        server.createLobby(nameToSend);
        setLobbyNameInput(""); 
    };
    
    const handleJoinLobby = (lobbyGuid: string) => {
        setError(null);
        server.joinToLobby(lobbyGuid);
    };

    const handleLeaveLobby = () => {
        setError(null);
        server.leaveLobby();
        setCurrentLobby(null);
        setPage(PAGES.GAME_MENU);
    };

    const handleSetReady = () => {
        setError(null);
        server.setReady();
    };

    const handleStartGameClick = () => {
        setError(null);
        server.startGame();
    };

    const handleBackToLogin = () => {
        if (currentLobby) {
            server.leaveLobby();
        }
        setPage(PAGES.LOGIN);
    };

    if (currentLobby) {
        const players = currentLobby?.playersGuids 
            ? (Array.isArray(currentLobby.playersGuids) 
                ? currentLobby.playersGuids 
                : Object.values(currentLobby.playersGuids))
            : [];

        const isOwner = currentLobby.lobbyGuid === user?.guid;

        return (
            <div className="start-game-page">
                <div className="start-game-container">
                    <h2>Лобби: {currentLobby.lobbyName || 'Безымянное'}</h2>
                    
                    {error && <div className="error-message">{error}</div>}

                    <div className="player-info-block">
                        <h4>Игроки:</h4>
                        <ul className="player-list">
                            {players.map((p: any) => (
                                <li key={p.guid} className="player-list-item">
                                    {p.guid === user?.guid ? <strong>Вы</strong> : `Игрок ${p.guid.slice(0,5)}`}
                                    <span className={`player-status ${p.ready ? 'ready' : 'not-ready'}`}>
                                        ({p.ready ? 'Готов' : 'Не готов'})
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lobby-actions">
                        <button onClick={handleSetReady}>Я готов</button>
                        <button onClick={handleLeaveLobby} className="btn-danger">Выйти</button>
                        
                        {isOwner && (
                            <button onClick={handleStartGameClick} className="btn-success">
                                Начать игру
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="start-game-page">
            <div className="start-game-container">
                <h2>Доступные лобби</h2>
                
                {error && <div className="error-message">{error}</div>}

                <div className="player-info-block">
                    {user ? (
                        <div className="info-row">
                            <span className="info-label">Вы вошли как:</span>
                            <span className="info-value">{user.name}</span>
                        </div>
                    ) : (
                        <div className="info-loading">Загрузка данных...</div>
                    )}
                </div>

                <div className="create-lobby-form">
                    <input 
                        type="text" 
                        value={lobbyNameInput}
                        onChange={(e) => setLobbyNameInput(e.target.value)}
                        placeholder="Название лобби"
                        className="lobby-input"
                    />
                    <button onClick={handleCreateLobby} className="create-lobby-btn">
                        Создать новое лобби
                    </button>
                </div>

                <div className="lobby-list-container">
                    {lobbies.length === 0 ? (
                        <div className="empty-list">Нет доступных лобби</div>
                    ) : (
                        lobbies.map((lobby: any) => (
                            <div key={lobby.lobbyGuid} className="lobby-item">
                                <span>{lobby.lobbyName || 'Lobby'}</span>
                                <button onClick={() => handleJoinLobby(lobby.lobbyGuid)}>Войти</button>
                            </div>
                        ))
                    )}
                </div>

                <button className="back-button" onClick={handleBackToLogin}>
                    Назад
                </button>
            </div>
        </div>
    );
}

export default Lobby;
