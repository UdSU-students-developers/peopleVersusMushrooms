import React, { useContext, useEffect, useState } from "react";
import CONFIG from "../../config";
import { MediatorContext, ServerContext } from "../../App";
import { TLobbies, TLobby, TUser, TPlayer, TLobbyServer } from "../../services/Server/types";
import { IBasePage, PAGES } from "../PageManager";
import Button from "../../components/Button/Button";

import "./LobbyMenu.css";

const LobbyMenu: React.FC<IBasePage> = ({ setPage }) => {
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

        const handleLobbyUpdate = (lobbyData: TLobbyServer | TLobbyServer[] | null) => {
            if (!lobbyData) {
                setCurrentLobby(null);
                return;
            }

            const candidates = Array.isArray(lobbyData) ? lobbyData : [lobbyData];
            
            let activeLobby: TLobby | null = null;
            const currentUserGuid = user?.guid;

            for (const serverLobby of candidates) {
                const normalizedLobby = normalizeLobbyData(serverLobby);
                const isUserInLobby = normalizedLobby.players.some(p => p.guid === currentUserGuid);

                if (isUserInLobby) {
                    activeLobby = normalizedLobby;

                    break;
                }
            }

            if (activeLobby) {
                setCurrentLobby(activeLobby);
            } else if (!Array.isArray(lobbyData)) {
                setCurrentLobby(null);
            }
        };

        const handleStartGame = () => {
            setPage(PAGES.GAME);
        };

        const handleError = (err: any) => {
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
    }, [mediator, server, setPage, user]);

    const normalizeLobbyData = (serverData: TLobbyServer): TLobby => {
        const players: TPlayer[] = [];

        if (serverData.playersGuids) {
            Object.entries(serverData.playersGuids).forEach(([role, guid]) => {
                if (guid) {
                    players.push({
                        guid: guid,
                        role: role,
                        ready: serverData.playersIsReady?.[role] ?? false 
                    });
                }
            });
        }

        return {
            lobbyGuid: serverData.lobbyGuid,
            lobbyName: serverData.lobbyName,
            players: players
        };
    };

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
        const players = currentLobby?.players 
            ? (Array.isArray(currentLobby.players) 
                ? currentLobby.players 
                : Object.values(currentLobby.players))
            : [];

        const isOwner = currentLobby.lobbyGuid === user?.guid;

        return (
            <div className="start-game-page">
                {user && (
                    <div className="user-info-corner">
                        <span className="user-label">Вы:</span>
                        <span className="user-name">{user.name}</span>
                    </div>
                )}

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
                                        {p.ready ? 'Готов' : 'Не готов'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lobby-actions">
                        <Button 
                            onClick={handleSetReady} 
                            text="Я готов" 
                            variant="accent" 
                        />
                        <Button 
                            onClick={handleLeaveLobby} 
                            text="Выйти" 
                            variant="danger" 
                        />
                        
                        {isOwner && (
                            <Button 
                                onClick={handleStartGameClick}
                                text="Начать игру" 
                                variant="primary" 
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="start-game-page">
            {user && (
                <div className="user-info-corner">
                    <span className="user-label">Вы вошли как:</span>
                    <span className="user-name">{user.name}</span>
                </div>
            )}

            <div className="start-game-container">
                <h2>Доступные лобби</h2>
                
                {error && <div className="error-message">{error}</div>}

                <div className="lobby-list-container">
                    {lobbies.length === 0 ? (
                        <div className="empty-list">Нет доступных лобби</div>
                    ) : (
                        lobbies.map((lobby: any) => (
                            <div key={lobby.lobbyGuid} className="lobby-item">
                                <span>{lobby.lobbyName || 'Lobby'}</span>
                                <Button 
                                    onClick={() => handleJoinLobby(lobby.lobbyGuid)} 
                                    text="Войти" 
                                    variant="primary" 
                                />
                            </div>
                        ))
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
                    <Button
                        onClick={handleCreateLobby} 
                        text="Создать" 
                        variant="primary" 
                        className="create-lobby-btn-custom" 
                    />
                </div>

                <div className="bottom-actions">
                    <Button 
                        onClick={handleBackToLogin} 
                        text="Назад" 
                        variant="main" 
                    />
                </div>
            </div>
        </div>
    );
}

export default LobbyMenu;