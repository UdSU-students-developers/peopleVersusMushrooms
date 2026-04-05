import React, { useContext, useEffect, useState } from 'react';
import { IBasePage, PAGES } from '../PageManager';
import { MediatorContext } from '../../App';
import CONFIG from '../../config';
import Button from '../../components/Button/Button';
import './GameMenu.css';

interface IUser {
    name: string;
    guid: string;
}

const GameMenu: React.FC<IBasePage> = (props: IBasePage) => {
    const { setPage } = props;
    const [userInfo, setUserInfo] = useState<IUser | null>(null);
    
    const mediator = useContext(MediatorContext);
    const { GET_STORE } = CONFIG.MEDIATOR.TRIGGERS;

    useEffect(() => {
        if (mediator) {
            const user = mediator.get<IUser | null>(GET_STORE, 'user');
            if (user) {
                setUserInfo(user);
            }
        }
    }, [mediator]);

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
                    {userInfo ? (
                        <>
                            <div className="info-row">
                                <span className="info-label">Игрок:</span>
                                <span className="info-value">{userInfo.name}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Socket ID:</span>
                                <span className="info-value socket-id">{userInfo.guid}</span>
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
