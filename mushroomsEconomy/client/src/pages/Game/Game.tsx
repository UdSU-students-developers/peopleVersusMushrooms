import React, { useContext } from 'react';
import { IBasePage } from '../PageManager';
import GameCanvas from './GameCanvas';

import "./Game.css"
import { MediatorContext, ServerContext } from '../../App';

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