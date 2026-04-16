import React, { useContext, useEffect, useState } from 'react';
import { IBasePage, PAGES } from '../PageManager';
import { MediatorContext } from '../../App';
import { TUser } from '../../services/Server/types';
import CONFIG from '../../config';
import Button from '../../components/Button/Button';
import './GameMenu.css';

const GameMenu: React.FC<IBasePage> = ({setPage}) => {   
    const mediator = useContext(MediatorContext);
    const { GET_STORE } = CONFIG.MEDIATOR.TRIGGERS;
    const user = mediator.get<TUser | null>(GET_STORE, 'user');

    const handleBackToGame = () => {
        setPage(PAGES.GAME);
    };

    const handleGoToChat = () => {
        setPage(PAGES.CHAT);
    };

    return (
        <div className='game-menu-page'>
            <div className='game-menu-container'>
                <h2>Меню игры</h2>

                <div className="player-info-block">
                    {user ? (
                        <>
                            <div className="info-row">
                                <span className="info-label">Игрок:</span>
                                <span className="info-value">{user.name}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Socket ID:</span>
                                <span className="info-value socket-id">{user.guid}</span>
                            </div>
                        </>
                    ) : (
                        <div className="info-loading">Загрузка данных...</div>
                    )}
                </div>

                <div className="menu-actions">
                    <Button 
                        onClick={handleBackToGame} 
                        text="Вернуться в игру" 
                        className="button button-primary"
                    />
                    <Button 
                        onClick={handleGoToChat} 
                        text="Чат" 
                        className="button button-secondary"
                    />
                </div>
            </div>
        </div>
    );
};

export default GameMenu;
