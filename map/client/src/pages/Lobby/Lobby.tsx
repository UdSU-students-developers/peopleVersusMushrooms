import React, { useEffect, useState } from "react";
import { IBasePage, IPageManager, PAGES } from '../PageManager';
import Button from "../../components/Button/Button";
import { TError } from "../../services/server/types";
import './Lobby.scss';

interface IRoom {
    guid: string;
    roomName: string;
    creator: string;
    players: Array<{ guid: string; name: string }>;
    maxPlayers: number;
    status: 'open' | 'closed' | 'started';
    gameState: 'waiting' | 'playing';
}

const Lobby: React.FC<IBasePage & IPageManager> = (props) => {
    const { setPage, server, mediator } = props;
    const [error, setError] = useState<TError | null>(null);
    const [rooms, setRooms] = useState<IRoom[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [currentRoom, setCurrentRoom] = useState<IRoom | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const logoutClickHandler = async () => {
        server.logout();
    }

    const createRoomClickHandler = () => {
        setShowCreateModal(true);
        setRoomName('');
    }

    const confirmCreateRoom = () => {
        if (roomName.trim()) {
            server.createRoom(roomName.trim());
            setShowCreateModal(false);
            setRoomName('');
        }
    }

    const cancelCreateRoom = () => {
        setShowCreateModal(false);
        setRoomName('');
    }

    const joinRoomHandler = (roomGuid: string) => {
        server.joinToRoom(roomGuid);
    }

    const leaveRoomHandler = () => {
        server.leaveRoom();
    }

    const startGameHandler = () => {
        server.startGame();
    }

    const getRoomsHandler = () => {
        setIsLoading(true);
        server.getRooms();
    }

    useEffect(() => {
        const {
            LOGOUT,
            SHOW_ERROR,
            CREATE_ROOM,
            JOIN_TO_ROOM,
            LEAVE_ROOM,
            GET_ROOMS,
            ROOM_UPDATED,
            ROOMS_LIST_UPDATED,
            START_GAME
        } = mediator.getEventTypes();

        const logoutHandler = () => {
            setError(null);
            setPage(PAGES.LOGIN);
        };

        const serverErrorHandler = (error: TError) => {
            setError(error);
            setIsLoading(false);
        };

        const createRoomHandler = (data: any) => {
            console.log('Комната создана:', data);
            setCurrentRoom(data.data);
            setIsLoading(false);
        };

        const joinToRoomHandler = (data: any) => {
            console.log('Присоединились к комнате:', data);
            setCurrentRoom(data.data);
            setIsLoading(false);
        };

        const leaveRoomHandler = (data: any) => {
            console.log('Покинули комнату:', data);
            setCurrentRoom(null);
            setIsLoading(false);
        };

        const getRoomsHandler = (data: any) => {
            console.log('Список комнат:', data);
            setRooms(data.data || []);
            setIsLoading(false);
        };

        const roomUpdatedHandler = (data: any) => {
            console.log('Комната обновлена:', data);
            setCurrentRoom(data.data);
        };

        const roomsListUpdatedHandler = (data: any) => {
            console.log('Список комнат обновлен:', data);
            setRooms(data.data || []);
        };

        const startGameHandler = (data: any) => {
            console.log('Игра началась:', data);
        };

        mediator.subscribe(LOGOUT, logoutHandler);
        mediator.subscribe(SHOW_ERROR, serverErrorHandler);
        mediator.subscribe(CREATE_ROOM, createRoomHandler);
        mediator.subscribe(JOIN_TO_ROOM, joinToRoomHandler);
        mediator.subscribe(LEAVE_ROOM, leaveRoomHandler);
        mediator.subscribe(GET_ROOMS, getRoomsHandler);
        mediator.subscribe(ROOM_UPDATED, roomUpdatedHandler);
        mediator.subscribe(ROOMS_LIST_UPDATED, roomsListUpdatedHandler);
        mediator.subscribe(START_GAME, startGameHandler);

        server.getRooms();

        return () => {
            mediator.unsubscribe(LOGOUT, logoutHandler);
            mediator.unsubscribe(SHOW_ERROR, serverErrorHandler);
            mediator.unsubscribe(CREATE_ROOM, createRoomHandler);
            mediator.unsubscribe(JOIN_TO_ROOM, joinToRoomHandler);
            mediator.unsubscribe(LEAVE_ROOM, leaveRoomHandler);
            mediator.unsubscribe(GET_ROOMS, getRoomsHandler);
            mediator.unsubscribe(ROOM_UPDATED, roomUpdatedHandler);
            mediator.unsubscribe(ROOMS_LIST_UPDATED, roomsListUpdatedHandler);
            mediator.unsubscribe(START_GAME, startGameHandler);
        };
    }, [mediator, setPage, server]);

    return (
        <div className='lobby'>
            <div className="lobby-header">
                <h1>Лобби</h1>
                <div className="lobby-actions">
                    <Button
                        onClick={getRoomsHandler}
                        text='Обновить комнаты'
                        className='button-refresh'
                        isDisabled={isLoading}
                    />
                    <Button
                        onClick={createRoomClickHandler}
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

            {currentRoom && (
                <div className="current-room">
                    <h2>Текущая комната: {currentRoom.roomName}</h2>
                    <div className="room-info">
                        <p>Создатель: {currentRoom.creator}</p>
                        <p>Игроки: {currentRoom.players.length}/{currentRoom.maxPlayers}</p>
                        <p>Статус: {currentRoom.status === 'open' ? 'Открыта' : currentRoom.status === 'closed' ? 'Закрыта' : 'В игре'}</p>
                        <div className="players-list">
                            <h3>Игроки:</h3>
                            <ul>
                                {currentRoom.players.map((player, index) => (
                                    <li key={index}>
                                        {player.name} {player.guid === currentRoom.creator && '(Создатель)'}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {currentRoom.creator === currentRoom.players[0]?.guid && currentRoom.players.length === currentRoom.maxPlayers && (
                            <Button
                                onClick={startGameHandler}
                                text='Начать игру'
                                className='button-start-game'
                            />
                        )}
                        <Button
                            onClick={leaveRoomHandler}
                            text='Покинуть комнату'
                            className='button-leave'
                        />
                    </div>
                </div>
            )}

            <div className="rooms-list">
                <h2>Доступные комнаты</h2>
                {isLoading && <p>Загрузка...</p>}
                {!isLoading && rooms.length === 0 && (
                    <p>Нет доступных комнат. Создайте первую!</p>
                )}
                {!isLoading && rooms.length > 0 && (
                    <div className="rooms-grid">
                        {rooms.map((room) => (
                            <div key={room.guid} className="room-card">
                                <h3>{room.roomName}</h3>
                                <p>Создатель: {room.creator}</p>
                                <p>Игроки: {room.players.length}/{room.maxPlayers}</p>
                                <p>Статус: {room.status === 'open' ? 'Открыта' : 'Закрыта'}</p>
                                {room.status === 'open' && room.players.length < room.maxPlayers && (
                                    <Button
                                        onClick={() => joinRoomHandler(room.guid)}
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
                <div className="modal-overlay" onClick={cancelCreateRoom}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Создать комнату</h2>
                        <input
                            type="text"
                            placeholder="Название комнаты"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            autoFocus
                        />
                        <div className="modal-buttons">
                            <Button
                                onClick={confirmCreateRoom}
                                text='Создать'
                                className='button-confirm'
                            />
                            <Button
                                onClick={cancelCreateRoom}
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