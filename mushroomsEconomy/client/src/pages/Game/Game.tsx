import React, { useState, useContext } from 'react';
import { IBasePage, PAGES } from '../PageManager';
import GameCanvas from './GameCanvas';
import Button from '../../components/Button/Button';
import ChatWidget from '../Chat/ChatWidget';
import { MediatorContext, ServerContext } from '../../App';

import "./Game.css";

const Game: React.FC<IBasePage> = ({ setPage }) => {
    const server = useContext(ServerContext);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleConfirmExit = () => {
        server.leaveLobby();
        setPage(PAGES.START_GAME);
    };

    return (
        <div className='game-page'>
            <div className="exit-button-container">
                <Button 
                    onClick={handleOpenModal} 
                    text="X" 
                    variant="danger" 
                    className="exit-btn"
                />
            </div>

            <GameCanvas />
            <ChatWidget />

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-window">
                        <h3>Выйти из игры?</h3>
                        <p>Вы точно хотите покинуть игру?</p>
                        <div className="modal-actions">
                            <Button 
                                onClick={handleConfirmExit} 
                                text="Да" 
                                variant="danger" 
                            />
                            <Button 
                                onClick={handleCloseModal} 
                                text="Нет" 
                                variant="primary" 
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Game;
