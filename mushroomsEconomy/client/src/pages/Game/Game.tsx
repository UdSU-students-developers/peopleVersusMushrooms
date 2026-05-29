import React, { useState, useContext, useEffect } from 'react';
import { IBasePage, PAGES } from '../PageManager';
import GameCanvas from './GameCanvas';
import Button from '../../components/Button/Button';
import ChatWidget from '../Chat/ChatWidget';
import { MediatorContext, ServerContext } from '../../App';
import { TResources } from '../../services/Server/types';

import "./Game.css";

const Game: React.FC<IBasePage> = ({ setPage }) => {
    const server = useContext(ServerContext);
    const mediator = useContext(MediatorContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [resources, setResources] = useState<TResources>({ iron: 0, energy: 0 });
    const [priority, setPriority] = useState('');

    useEffect(() => {
        const { START_GAME, UPDATE_SCENE } = mediator.getEventTypes();

        const onScene = (data: any) => {
            if (data?.resources) {
                setResources({ ...data.resources });
            }
            if (data?.priority) {
                setPriority(data.priority);
            }
        };

        mediator.subscribe(START_GAME, onScene);
        mediator.subscribe(UPDATE_SCENE, onScene);

        return () => {
            mediator.unsubscribe(START_GAME, onScene);
            mediator.unsubscribe(UPDATE_SCENE, onScene);
        };
    }, [mediator]);

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
                    text="Выйти" 
                    variant="danger" 
                    className="exit-btn"
                />
            </div>

            <GameCanvas />

            <div className="resources-bar">
                <span className="resource-item resource-iron">⛏ Железо: {resources.iron}</span>
                <span className="resource-item resource-energy">⚡ Энергия: {resources.energy}</span>
                <span className="resource-item resource-iron">Приоритет: {priority}</span>
            </div>

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