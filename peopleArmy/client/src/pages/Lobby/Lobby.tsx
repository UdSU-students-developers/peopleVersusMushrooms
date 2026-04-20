import React, { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { IBasePage, PAGES } from '../PageManager';
import CONFIG from '../../config';
import './Lobby.css';

type TLobby = {
    lobbyGuid: string;
    lobbyName: string;
    playersGuids: Record<string, string | null>;
};

const Lobby: React.FC<IBasePage> = ({ mediator, setPage }) => {
    const [lobbyName, setLobbyName] = useState('Моё лобби');
    const [lobbies, setLobbies] = useState<TLobby[]>([]);
    const [currentLobbyGuid, setCurrentLobbyGuid] = useState<string | null>(null);

    const guid: string | null = mediator.get(CONFIG.MEDIATOR.TRIGGERS.GET_STORE, 'guid');
    const socket: Socket | null = mediator.get(CONFIG.MEDIATOR.TRIGGERS.GET_STORE, 'socket');

    useEffect(() => {
        if (!socket || !guid) return;

        const onLobbyUpdated = (response: { result?: string; data?: TLobby[] }) => {
            if (response?.result !== 'ok' || !Array.isArray(response.data)) return;
            setLobbies(response.data);
            const joinedLobby = response.data.find((lobby) =>
                Object.values(lobby.playersGuids).includes(guid)
            );
            setCurrentLobbyGuid(joinedLobby?.lobbyGuid ?? null);
        };

        socket.on(CONFIG.SOCKETS.LOBBY_UPDATED, onLobbyUpdated);
        socket.emit(CONFIG.SOCKETS.GET_LOBBIES, { guid });

        return () => {
            socket.off(CONFIG.SOCKETS.LOBBY_UPDATED, onLobbyUpdated);
        };
    }, [socket, guid]);

    const createLobby = () => {
        if (!socket || !guid) {
            return;
        }
        socket.emit(CONFIG.SOCKETS.CREATE_LOBBY, {
            guid,
            lobbyName: lobbyName.trim() || 'Лобби',
        });
    };

    const joinLobby = (lobbyGuid: string) => {
        if (!socket || !guid) return;
        socket.emit(CONFIG.SOCKETS.JOIN_TO_LOBBY, { guid, lobbyGuid });
    };

    const leaveLobby = () => {
        if (!socket || !guid) {
            return;
        }
        socket.emit(CONFIG.SOCKETS.LEAVE_LOBBY, { guid });
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
                        <button
                            type="button"
                            className="lobby-btn lobby-btn-secondary"
                            onClick={leaveLobby}
                            disabled={!socket || !guid}
                        >
                            Выйти из лобби
                        </button>
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
