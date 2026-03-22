import React from 'react';
import { IBasePage } from '../PageManager';
import GameCanvas from './GameCanvas';

import "./Game.css"

const GAME_FIELD = 'game-field';

const Game: React.FC<IBasePage> = (props: IBasePage) => {
    const { setPage } = props;
    
    return (
    <div className='game'>
        <div>
            <GameCanvas />
        </div>
    </div>
);
};

export default Game;