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
            setLobbyName('');
        }
    }

    const cancelCreateLobby = () => {
        setShowCreateModal(false);
        setLobbyName('');
    }

    const joinLobbyHandler = (lobbyGuid: string) => {
        server.joinToLobby(server.user.guid, lobbyGuid, 'spectator');
    }

    const leaveLobbyHandler = () => {
        server.leaveLobby(server.user.guid);
    }

    const startGameHandler = () => {
        server.generateMap();
        server.startGame(server.user.guid);
        setPage(PAGES.MAP);
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
            GENERATE_MAP
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
            console.log('Комната создана:', data);
            setCurrentLobby(data);
            setIsLoading(false);
        };

        const mapHandler = (data: TMap) => {
            console.log('Карта получена:', data);
            server.setGeneratedMap(data);
        };

        const joinToLobbyHandler = (data: any) => {
            console.log('Присоединились к комнате:', data);
            setCurrentLobby(data);
            setIsLoading(false);
        };

        const leaveLobbyHandler = (data: any) => {
            console.log('Покинули комнату:', data);
            setCurrentLobby(null);
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
        };

        const lobbiesListUpdatedHandler = (data: any) => {
            console.log('Список комнат обновлен:', data);
            setLobbies(data || []);
        };

        const startGameHandler = (data: any) => {
            console.log('Игра началась:', data);
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

        };
    }, [mediator, setPage, server]);

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
                        <p>Создатель: {currentLobby.players.find(p => p.guid === currentLobby.creatorGuid)?.role}</p>
                        <p>Игроки: {currentLobby.players.length}/5</p>
                        <div className="players-list">
                            <h3>Игроки:</h3>
                            <ul>
                                {currentLobby.players.map((player, index) => (
                                    <li key={index}>
                                        {player.role} {player.guid === currentLobby.creatorGuid && '(Создатель)'}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {currentLobby.creatorGuid === currentLobby.players[0]?.guid && currentLobby.players.length === 5 && (
                            <Button
                                onClick={startGameHandler}
                                text='Начать игру'
                                className='button-start-game'
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
                            <div key={lobby.creatorGuid} className="lobby-card">
                                <h3>{lobby.lobbyName}</h3>
                                <p>Создатель: {lobby.players.find(p => p.guid === lobby.creatorGuid)?.role}</p>
                                <p>Игроки: {lobby.players.length}/5</p>
                                {lobby.players.length < 5 && (
                                    <Button
                                        onClick={() => joinLobbyHandler(lobby.creatorGuid)}
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