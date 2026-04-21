import React, { useEffect, useMemo, useState } from 'react';
import { Socket } from 'socket.io-client';
import { IBasePage, PAGES } from '../PageManager';
import CONFIG from '../../config';
import './Lobby.css';

type TLobby = {
    lobbyGuid: string;
    lobbyName: string;
    playersGuids: Record<string, string | null>;
    playersIsReady?: Record<string, boolean>;
};

const Lobby: React.FC<IBasePage> = ({ mediator, setPage }) => {
    const [lobbyName, setLobbyName] = useState('Моё лобби');
    const [lobbies, setLobbies] = useState<TLobby[]>([]);
    const [currentLobbyGuid, setCurrentLobbyGuid] = useState<string | null>(null);
    const [readySubmitted, setReadySubmitted] = useState(false);

    const guid: string | null = mediator.get(CONFIG.MEDIATOR.TRIGGERS.GET_STORE, 'guid');
    const socket: Socket | null = mediator.get(CONFIG.MEDIATOR.TRIGGERS.GET_STORE, 'socket');

    const currentLobby = useMemo(() => {
        if (!currentLobbyGuid) return null;
        return lobbies.find((l) => l.lobbyGuid === currentLobbyGuid) ?? null;
    }, [lobbies, currentLobbyGuid]);

    const allPlayersReady = useMemo(() => {
        if (!currentLobby?.playersGuids || !currentLobby.playersIsReady) return false;
        return Object.entries(currentLobby.playersGuids).every(([role, playerGuid]) => {
            if (!playerGuid) return true;
            return currentLobby.playersIsReady![role] === true;
        });
    }, [currentLobby]);

    const isHost = Boolean(guid && currentLobbyGuid && guid === currentLobbyGuid);

    useEffect(() => {
        if (!socket || !guid) return;

        const applyLobbiesPayload = (response: { result?: string; data?: TLobby[] }) => {
            if (response?.result !== 'ok' || !Array.isArray(response.data)) return;
            setLobbies(response.data);
            const joinedLobby = response.data.find((lobby) =>
                Object.values(lobby.playersGuids).includes(guid)
            );
            setCurrentLobbyGuid(joinedLobby?.lobbyGuid ?? null);
            if (joinedLobby?.playersIsReady) {
                const role = Object.entries(joinedLobby.playersGuids).find(([, g]) => g === guid)?.[0];
                if (role) {
                    setReadySubmitted(Boolean(joinedLobby.playersIsReady[role]));
                }
            }
        };

        const onSetReadyResponse = (response: { result?: string; data?: unknown }) => {
            if (response?.result === 'ok' && response.data === true) {
                setReadySubmitted(true);
            }
        };

        const onSetNotReadyResponse = (response: { result?: string; data?: unknown }) => {
            if (response?.result === 'ok' && response.data === true) {
                setReadySubmitted(false);
            }
        };

        socket.on(CONFIG.SOCKETS.LOBBY_UPDATED, applyLobbiesPayload);
        socket.on(CONFIG.SOCKETS.SET_READY, onSetReadyResponse);
        socket.on(CONFIG.SOCKETS.SET_NOT_READY, onSetNotReadyResponse);
        socket.emit(CONFIG.SOCKETS.GET_LOBBIES, { guid });

        return () => {
            socket.off(CONFIG.SOCKETS.LOBBY_UPDATED, applyLobbiesPayload);
            socket.off(CONFIG.SOCKETS.SET_READY, onSetReadyResponse);
            socket.off(CONFIG.SOCKETS.SET_NOT_READY, onSetNotReadyResponse);
        };
    }, [socket, guid]);

    const createLobby = () => {
        if (!socket || !guid) {
            return;
        }
        setReadySubmitted(false);
        setCurrentLobbyGuid(guid);
        socket.emit(CONFIG.SOCKETS.CREATE_LOBBY, {
            guid,
            lobbyName: lobbyName.trim() || 'Лобби',
        });
    };

    const joinLobby = (lobbyGuid: string) => {
        if (!socket || !guid) return;
        setReadySubmitted(false);
        setCurrentLobbyGuid(lobbyGuid);
        socket.emit(CONFIG.SOCKETS.JOIN_TO_LOBBY, { guid, lobbyGuid });
    };

    const leaveLobby = () => {
        if (!socket || !guid) {
            return;
        }
        setReadySubmitted(false);
        setCurrentLobbyGuid(null);
        socket.emit(CONFIG.SOCKETS.LEAVE_LOBBY, { guid });
    };

    const setReady = () => {
        if (!socket || !guid || readySubmitted) return;
        socket.emit(CONFIG.SOCKETS.SET_READY, { guid });
    };

    const setNotReady = () => {
        if (!socket || !guid || !readySubmitted) return;
        socket.emit(CONFIG.SOCKETS.SET_NOT_READY, { guid });
    };

    const toggleReady = () => {
        if (readySubmitted) {
            setNotReady();
        } else {
            setReady();
        }
    };

    const startGame = () => {
        if (!socket || !guid || !isHost || !allPlayersReady) return;
        socket.emit(CONFIG.SOCKETS.START_GAME, { guid });
    };

    return (
        <div className="lobby-page">
            <div className="lobby-card">
                <h1 className="lobby-title">Лобби</h1>

                <label className="lobby-label" htmlFor="lobby-name">
                    Название
                </label>
                <input
                    id="lobby-name"
                    className="lobby-input"
                    value={lobbyName}
                    onChange={(e) => setLobbyName(e.target.value)}
                    disabled={!socket || !guid}
                />

                <div className="lobby-actions">
                    <button
                        type="button"
                        className="lobby-btn lobby-btn-primary"
                        onClick={createLobby}
                        disabled={!socket || !guid}
                    >
                        Создать лобби
                    </button>
                    {currentLobbyGuid && (
                        <>
                            <button
                                type="button"
                                className={`lobby-btn lobby-btn-ready-toggle ${readySubmitted ? 'lobby-btn-secondary' : 'lobby-btn-primary'}`}
                                onClick={toggleReady}
                                disabled={!socket || !guid}
                            >
                                <span className={readySubmitted ? 'hidden' : ''}>Готов</span>
                                <span className={readySubmitted ? '' : 'hidden'}>Не готов</span>
                            </button>
                            {isHost && (
                                <button
                                    type="button"
                                    className="lobby-btn lobby-btn-primary"
                                    onClick={startGame}
                                    disabled={!socket || !guid || !allPlayersReady}
                                >
                                    Начать игру
                                </button>
                            )}
                            <button
                                type="button"
                                className="lobby-btn lobby-btn-secondary"
                                onClick={leaveLobby}
                                disabled={!socket || !guid}
                            >
                                Выйти из лобби
                            </button>
                        </>
                    )}
                    <button
                        type="button"
                        className="lobby-btn lobby-btn-ghost"
                        onClick={() => setPage(PAGES.GAME)}
                    >
                        ← К игре
                    </button>
                </div>

                <div className="lobby-list">
                    <h2 className="lobby-list-title">Список лобби</h2>
                    {lobbies.length === 0 && <p className="lobby-empty">Нет доступных лобби</p>}
                    {lobbies.map((lobby) => {
                        const playersCount = Object.values(lobby.playersGuids).filter(Boolean).length;
                        const isCurrent = lobby.lobbyGuid === currentLobbyGuid;
                        return (
                            <div className="lobby-item" key={lobby.lobbyGuid}>
                                <div className="lobby-item-info">
                                    <div>{lobby.lobbyName}</div>
                                    <div className="lobby-item-meta">{playersCount}/5 игроков</div>
                                </div>
                                {!isCurrent && (
                                    <button
                                        type="button"
                                        className="lobby-btn lobby-btn-secondary"
                                        onClick={() => joinLobby(lobby.lobbyGuid)}
                                        disabled={!socket || !guid}
                                    >
                                        Войти
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Lobby;
