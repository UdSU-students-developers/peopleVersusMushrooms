import React, { useEffect, useState, useContext } from "react";
import { MediatorContext, ServerContext } from "../../App";
import { IBasePage, PAGES } from '../PageManager';
import Button from "../../components/Button/Button";
import { ILobby, TError, TMap } from "../../services/server/types";
import './Lobby.scss';

const Lobby: React.FC<IBasePage> = (props) => {
    const { setPage } = props;
    const mediator = useContext(MediatorContext);
    const server = useContext(ServerContext);
    const [error, setError] = useState<TError | null>(null);
    const [lobbies, setLobbies] = useState<ILobby[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [lobbyName, setLobbyName] = useState('');
    const [currentLobby, setCurrentLobby] = useState<ILobby | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const logoutClickHandler = async () => {
        server.logout();
    }

    const createLobbyClickHandler = () => {
        setShowCreateModal(true);
        setLobbyName('');
    }

    const confirmCreateLobby = () => {
        if (lobbyName.trim()) {
            console.log(server.user.guid)
            server.createLobby(server.user.guid, lobbyName.trim(), 'spectator');
            server.generateMap(server.user.guid);
            setLobbyName('');
            setShowCreateModal(false);
        }
    }

    const cancelCreateLobby = () => {
        setShowCreateModal(false);
        setLobbyName('');
    }

    const joinLobbyHandler = (lobbyGuid: string) => {
        server.joinToLobby(server.user.guid, lobbyGuid, 'spectator');
        server.generateMap(server.user.guid);

    }

    const leaveLobbyHandler = () => {
        setIsReady(false);
        server.leaveLobby(server.user.guid);
    }

    const startGameHandler = () => {
        server.startGame(server.user.guid);
        setPage(PAGES.MAP);
    }

    const setReadyHandler = () => {
        server.setReady(server.user.guid);
    }

    const kickPlayerHandler = (targetGuid: string) => {
        if (window.confirm('Вы уверены, что хотите кикнуть этого игрока?')) {
            server.dropFromLobby(server.user.guid, targetGuid);
        }
    }

    useEffect(() => {
        const {
            LOGOUT,
            SHOW_ERROR,
            CREATE_LOBBY,
            JOIN_TO_LOBBY,
            LEAVE_LOBBY,
            LOBBY_UPDATED,
            LOBBIES_LIST_UPDATED,
            START_GAME,
            GENERATE_MAP,
            SET_READY,
            DROP_FROM_LOBBY
        } = mediator.getEventTypes();

        const logoutHandler = () => {
            setError(null);
            setPage(PAGES.LOGIN);
        };

        const serverErrorHandler = (error: TError) => {
            setError(error);
            setIsLoading(false);
        };

        const createLobbyHandler = (data: any) => {
            setCurrentLobby(data);
            setIsReady(false);
            setIsLoading(false);
        };

        const mapHandler = (data: TMap) => {
            console.log('Карта получена:', data);
            server.setGeneratedMap(data);
        };

        const joinToLobbyHandler = (data: any) => {
            console.log('Присоединились к комнате:', data);
            setCurrentLobby(data);
            setIsReady(false);
            setIsLoading(false);
        };

        const leaveLobbyHandler = (data: any) => {
            console.log('Покинули комнату:', data);
            setCurrentLobby(null);
            setIsReady(false);
            setIsLoading(false);
        };

        const getLobbiesHandler = () => {
            const data = server.getLobbies();
            console.log('Список комнат:', data);
            setLobbies(data || []);
            setIsLoading(false);
        };

        const lobbyUpdatedHandler = (data: any) => {
            console.log('Комната обновлена:', data);
            setCurrentLobby(data);
            if (data.playersReady && server.user) {
                const userRole = Object.keys(data.playersGuids).find(
                    role => data.playersGuids[role] === server.user.guid
                );
                if (userRole) {
                    setIsReady(data.playersReady[userRole] || false);
                }
            }
        };

        const lobbiesListUpdatedHandler = (data: any) => {
            console.log('Список комнат обновлен:', data);
            setLobbies(data || []);
        };

        const startGameHandler = (data: any) => {
            console.log('Игра началась:', data);
        };

        const setReadyHandler = (data: any) => {
            setIsReady(true);
        };

        const dropFromLobbyHandler = (data: any) => {
            console.log('Игрок кикнут из лобби:', data);
            if (data && currentLobby && currentLobby.lobbyGuid === data.lobbyGuid) {
                setCurrentLobby(data);
            }
        };

        mediator.subscribe(LOGOUT, logoutHandler);
        mediator.subscribe(SHOW_ERROR, serverErrorHandler);
        mediator.subscribe(CREATE_LOBBY, createLobbyHandler);
        mediator.subscribe(JOIN_TO_LOBBY, joinToLobbyHandler);
        mediator.subscribe(LEAVE_LOBBY, leaveLobbyHandler);
        getLobbiesHandler();
        mediator.subscribe(LOBBY_UPDATED, lobbyUpdatedHandler);
        mediator.subscribe(LOBBIES_LIST_UPDATED, lobbiesListUpdatedHandler);
        mediator.subscribe(START_GAME, startGameHandler);
        mediator.subscribe(GENERATE_MAP, mapHandler);
        mediator.subscribe(SET_READY, setReadyHandler);
        mediator.subscribe(DROP_FROM_LOBBY, dropFromLobbyHandler);

        return () => {
            mediator.unsubscribe(LOGOUT, logoutHandler);
            mediator.unsubscribe(SHOW_ERROR, serverErrorHandler);
            mediator.unsubscribe(CREATE_LOBBY, createLobbyHandler);
            mediator.unsubscribe(JOIN_TO_LOBBY, joinToLobbyHandler);
            mediator.unsubscribe(LEAVE_LOBBY, leaveLobbyHandler);
            mediator.unsubscribe(LOBBY_UPDATED, lobbyUpdatedHandler);
            mediator.unsubscribe(LOBBIES_LIST_UPDATED, lobbiesListUpdatedHandler);
            mediator.unsubscribe(START_GAME, startGameHandler);
            mediator.unsubscribe(GENERATE_MAP, mapHandler);
            mediator.unsubscribe(SET_READY, setReadyHandler);
            mediator.unsubscribe(DROP_FROM_LOBBY, dropFromLobbyHandler);
        };
    }, [mediator, setPage, server, currentLobby]);

    return (
        <div className='lobby'>
            <div className="lobby-header">
                <h1>Лобби</h1>
                <div className="lobby-actions">
                    <Button
                        onClick={createLobbyClickHandler}
                        text='Создать комнату'
                        className='button-create'
                    />
                    <Button
                        onClick={logoutClickHandler}
                        text='Выйти'
                        className='button-logout'
                    />
                </div>
            </div>

            {error && <p id='test-errors-lobby' className='errors'>{error.message}</p>}

            {currentLobby && (
                <div className="current-lobby">
                    <h2>Текущая комната: {currentLobby.lobbyName}</h2>
                    <div className="lobby-info">
                        <p>Игроки: {Object.values(currentLobby.playersGuids).filter(g => g !== null).length}/5</p>
                        <div className="players-list">
                            <h3>Игроки:</h3>
                            <ul>
                                {
                                    Object.keys(currentLobby.playersGuids)
                                        .filter(role => currentLobby.playersGuids[role as keyof typeof currentLobby.playersGuids] !== null)
                                        .map((role, index) => {
                                            const playerGuid = currentLobby.playersGuids[role as keyof typeof currentLobby.playersGuids];
                                            const isCreator = playerGuid === currentLobby.lobbyGuid;
                                            const isCurrentUser = playerGuid === server.user?.guid;
                                            const canKick = currentLobby.lobbyGuid === server.user?.guid && !isCreator && !isCurrentUser;

                                            return (
                                                <li key={index} className="player-item">
                                                    {canKick && (
                                                        <Button
                                                            onClick={() => kickPlayerHandler(playerGuid!)}
                                                            text='Кикнуть'
                                                            className='button-kick'
                                                        />
                                                    )}
                                                </li>
                                            );
                                        })
                                }
                            </ul>
                        </div>
                        <div className="player-info">
                            {isReady ? '✅ Готов' : '⏳ Не готов'}
                        </div>
                        <Button
                            onClick={setReadyHandler}
                            text={'Готов'}
                        />

                        {currentLobby.lobbyGuid === currentLobby.playersGuids.spectator && (
                            <Button
                                onClick={startGameHandler}
                                text='Начать игру'
                                className='button-start-game'
                                isDisabled={!isReady}
                            />
                        )}
                        <Button
                            onClick={leaveLobbyHandler}
                            text='Покинуть комнату'
                            className='button-leave'
                        />
                    </div>
                </div>
            )}

            <div className="lobbies-list">
                <h2>Доступные комнаты</h2>
                {isLoading && <p>Загрузка...</p>}
                {!isLoading && lobbies.length === 0 && (
                    <p>Нет доступных комнат. Создайте первую!</p>
                )}
                {!isLoading && lobbies.length > 0 && (
                    <div className="lobbies-grid">
                        {lobbies.map((lobby) => (
                            <div key={lobby.lobbyGuid} className="lobby-card">
                                <h3>{lobby.lobbyName}</h3>
                                <p>Игроки: {Object.values(lobby.playersGuids).filter(g => g !== null).length}/5</p>
                                {Object.values(lobby.playersGuids).filter(g => g !== null).length < 5 && (
                                    <Button
                                        onClick={() => joinLobbyHandler(lobby.lobbyGuid)}
                                        text='Присоединиться'
                                        className='button-join'
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showCreateModal && (
                <div className="modal-overlay" onClick={cancelCreateLobby}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Создать комнату</h2>
                        <input
                            type="text"
                            placeholder="Название комнаты"
                            value={lobbyName}
                            onChange={(e) => setLobbyName(e.target.value)}
                            autoFocus
                        />
                        <div className="modal-buttons">
                            <Button
                                onClick={confirmCreateLobby}
                                text='Создать'
                                className='button-confirm'
                            />
                            <Button
                                onClick={cancelCreateLobby}
                                text='Отмена'
                                className='button-cancel'
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Lobby;