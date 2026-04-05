import React, { useContext } from 'react';
import { IBasePage, PAGES } from '../PageManager';
import GameCanvas from './GameCanvas';
import Button from '../../components/Button/Button';

import "./Game.css"
import { MediatorContext, ServerContext } from '../../App';

const GAME_FIELD = 'game-field';

const Game: React.FC<IBasePage> = (props: IBasePage) => {
    const { setPage } = props;

    const handleOpenMenu = () => {
        setPage(PAGES.GAME_MENU);
    };

    return (
    <div className='game'>
        <div>
                <GameCanvas />
        </div>

        <div className="game-menu-btn-container">
                <Button 
                    onClick={handleOpenMenu} 
                    text="Меню" 
                    className="menu-toggle-btn"
                />
            </div>
    </div>
);
};

export default Game;