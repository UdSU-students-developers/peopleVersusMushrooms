import React, { useContext } from 'react';
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
            {user && (
                <div className="user-info-corner">
                    <span className="user-label">Игрок:</span>
                    <span className="user-name">{user.name}</span>
                </div>
            )}

            <div className='game-menu-container'>
                <h2>Меню игры</h2>

                <div className="menu-actions">
                    <Button 
                        onClick={handleBackToGame} 
                        text="Вернуться в игру" 
                        variant="primary" 
                    />
                    <Button 
                        onClick={handleGoToChat} 
                        text="Чат" 
                        variant="accent" 
                    />
                </div>
            </div>
        </div>
    );
};

export default GameMenu;
