import React, { useContext, useState } from 'react';
import { IBasePage, PAGES } from '../PageManager';
import GameCanvas from './GameCanvas';
import Button from '../../components/Button/Button';
import CONFIG from '../../config';
import "./Game.css";
import { MediatorContext, ServerContext } from '../../App';
import { useEffect } from 'react';

interface IUser {
    name: string;
    token: string;
    guid: string;
}

const Game: React.FC<IBasePage> = (props: IBasePage) => {
    const { setPage } = props;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleResume = () => {
        setIsMenuOpen(false);
    };

    const handleGoToChat = () => {
        setIsMenuOpen(false);
        setPage(PAGES.CHAT); 
    };

    return (
        <div className='game'>
            <div>
                <GameCanvas />
            </div>

            <div className="game-menu-btn-container">
                <Button 
                    onClick={toggleMenu} 
                    text="Меню" 
                    className="menu-toggle-btn"
                />
            </div>

            {isMenuOpen && (
                <div className="game-menu-overlay">
                    <div className="game-menu-content">
                        <h2>Меню</h2>
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
                        <div className="game-menu-buttons">
                            <Button 
                                onClick={handleResume} 
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
            )}
        </div>
    );
};

export default Game;
