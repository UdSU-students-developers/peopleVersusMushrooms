import React, { useContext, useState } from 'react';
import Registration from './Registration/Registration';
import Login from './Login/Login';
import Game from './Game/Game';
import StartGame from './LobbyMenu/LobbyMenu'

import CONFIG from '../config';


export enum PAGES {
    LOGIN,
    REGISTRATION,
    CHAT,
    GAME,
    GAME_MENU,
    START_GAME,
}

export interface IBasePage {
    setPage: (name: PAGES) => void;
}

const PageManager: React.FC = () => {
    const [page, setPage] = useState<PAGES>(PAGES.LOGIN);

    const props = {
        setPage,
    }

    return (
        <>
            {page === PAGES.REGISTRATION && <Registration {...props} />}
            {page === PAGES.LOGIN && <Login {...props} />}
            {page === PAGES.GAME && <Game {...props} />}
            {page === PAGES.START_GAME && <StartGame {... props} />}
        </>
    );
}

export default PageManager;