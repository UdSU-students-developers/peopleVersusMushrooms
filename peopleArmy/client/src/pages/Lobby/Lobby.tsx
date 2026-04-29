import React, { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { IBasePage, PAGES } from '../PageManager';
import CONFIG from '../../config';
import './Lobby.css';

type TLobby = {
    lobbyGuid: string;
    lobbyName: string;
    playersGuids: Record<string, string | null>;
    playersIsReady: Record<string, boolean>;
};

type TStartGameResponse = {
    result?: string;
    data?: {
        map?: number[][];
    };
};

const Lobby: React.FC<IBasePage> = ({ mediator, setPage }) => {
    const [lobbyName, setLobbyName] = useState('Моё лобби');
    const [lobbies, setLobbies] = useState<TLobby[]>([]);
    const [currentLobbyGuid, setCurrentLobbyGuid] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);

    const guid: string | null = mediator.get(CONFIG.MEDIATOR.TRIGGERS.GET_STORE, 'guid');
    const socket: Socket | null = mediator.get(CONFIG.MEDIATOR.TRIGGERS.GET_STORE, 'socket');

    // Обновляет список лобби и синхронизирует локальное состояние игрока:
    // в каком лобби он находится и отмечен ли как готовый
    const applyLobbies = (data: TLobby[], currentGuid: string) => {
        setLobbies(data);
        const joinedLobby = data.find((lobby) =>
            Object.values(lobby.playersGuids).includes(currentGuid)
        );
        setCurrentLobbyGuid(joinedLobby?.lobbyGuid ?? null);
        if (joinedLobby) {
            const role = Object.keys(joinedLobby.playersGuids).find(
                (r) => joinedLobby.playersGuids[r] === currentGuid
            );
            setIsReady(role ? (joinedLobby.playersIsReady[role] ?? false) : false);
        } else {
            setIsReady(false);
        }
    };

    useEffect(() => {
        if (!socket || !guid) return;

        // рассылка карты сервисам об изменении списка лобби
        const onLobbiesListUpdated = (response: { result?: string; data?: TLobby[] }) => {
            if (response?.result !== 'ok' || !Array.isArray(response.data)) return;
            applyLobbies(response.data, guid);
        };

        // загрузка лобби при загрузке страницы
        const onGetLobbiesResponse = (response: { result?: string; data?: TLobby[] }) => {
            if (response?.result !== 'ok' || !Array.isArray(response.data)) return;
            applyLobbies(response.data, guid);
        };

        // Карта запустила игру — переходим на игровую страницу
        const onStartGame = (response: TStartGameResponse) => {
            const map = response?.data?.map;
            if (response?.result !== 'ok' || !Array.isArray(map)) {
                return;
            }
            console.log("карта дошла до лобби");
            mediator.get(CONFIG.MEDIATOR.TRIGGERS.SET_STORE, { name: 'map', value: map });
            setPage(PAGES.GAME);
        };

        socket.on(CONFIG.SOCKETS.LOBBIES_LIST_UPDATED, onLobbiesListUpdated);
        socket.on(CONFIG.SOCKETS.GET_LOBBIES, onGetLobbiesResponse);
        socket.on(CONFIG.SOCKETS.START_GAME, onStartGame);

        // Запрашиваем актуальный список лобби при входе на страницу
        socket.emit(CONFIG.SOCKETS.GET_LOBBIES, { guid });

        return () => {
            socket.off(CONFIG.SOCKETS.LOBBIES_LIST_UPDATED, onLobbiesListUpdated);
            socket.off(CONFIG.SOCKETS.GET_LOBBIES, onGetLobbiesResponse);
            socket.off(CONFIG.SOCKETS.START_GAME, onStartGame);
        };
    }, [socket, guid, mediator, setPage]);

    const createLobby = () => {
        if (!socket || !guid) return;
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
        if (!socket || !guid) return;
        socket.emit(CONFIG.SOCKETS.LEAVE_LOBBY, { guid });
    };

    // Помечает игрока готовым;
    const setReady = () => {
        if (!socket || !guid) return;
        socket.emit(CONFIG.SOCKETS.SET_READY, { guid });
        setIsReady(true);
    };

    // Доступно только создателю лобби; карта проверит готовность игроков на своей стороне
    const startGame = () => {
        if (!socket || !guid) return;
        socket.emit(CONFIG.SOCKETS.START_GAME, { guid });
    };

    const currentLobby = lobbies.find((l) => l.lobbyGuid === currentLobbyGuid);
    // Создатель лобби — тот, чей guid совпадает с lobbyGuid 
    const isCreator = currentLobbyGuid === guid;

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
                    disabled={!socket || !guid || !!currentLobbyGuid}
                />

                <div className="lobby-actions">
                    {!currentLobbyGuid && (
                        <button
                            type="button"
                            className="lobby-btn lobby-btn-primary"
                            onClick={createLobby}
                            disabled={!socket || !guid}
                        >
                            Создать лобби
                        </button>
                    )}
                    {currentLobbyGuid && (
                        <>
                            {!isReady && (
                                <button
                                    type="button"
                                    className="lobby-btn lobby-btn-primary"
                                    onClick={setReady}
                                    disabled={!socket || !guid}
                                >
                                    Готов
                                </button>
                            )}
                            {isCreator && (
                                <button
                                    type="button"
                                    className="lobby-btn lobby-btn-success"
                                    onClick={startGame}
                                    disabled={!socket || !guid}
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

                {currentLobby && (
                    <div className="lobby-current">
                        <h2 className="lobby-list-title">Текущее лобби: {currentLobby.lobbyName}</h2>
                        <div className="lobby-players">
                            {Object.entries(currentLobby.playersGuids).map(([role, playerGuid]) => (
                                <div key={role} className="lobby-player-row">
                                    <span className="lobby-player-role">{role}</span>
                                    <span className="lobby-player-status">
                                        {playerGuid
                                            ? currentLobby.playersIsReady[role]
                                                ? '✓ Готов'
                                                : '⏳ Не готов'
                                            : '— Свободно'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="lobby-list">
                    <h2 className="lobby-list-title">Список лобби</h2>
                    {lobbies.length === 0 && <p className="lobby-empty">Нет доступных лобби</p>}
                    {lobbies.map((lobby) => {
                        const playersCount = Object.values(lobby.playersGuids).filter(Boolean).length;
                        const isCurrent = lobby.lobbyGuid === currentLobbyGuid;
                        return (
                            <div className={`lobby-item${isCurrent ? ' lobby-item-active' : ''}`} key={lobby.lobbyGuid}>
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
                                {isCurrent && <span className="lobby-item-badge">Вы здесь</span>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Lobby;
