import React, { useState } from 'react';
import Registration from './Registration/Registration';
import Login from './Login/Login';
import Game from './Game/Game';
import StartGame from './LobbyMenu/LobbyMenu'

export enum PAGES {
    LOGIN,
    REGISTRATION,
    CHAT,
    GAME,
    START_GAME,
}

export interface IBasePage {
    setPage: (name: PAGES) => void;
    onChangeRole?: () => void;
}

const PageManager: React.FC<{ onChangeRole?: () => void }> = ({ onChangeRole }) => {
    const [page, setPage] = useState<PAGES>(PAGES.LOGIN);

    const props = {
        setPage,
        onChangeRole,
    };

    return (
        <>
            {page === PAGES.REGISTRATION && <Registration {...props} />}
            {page === PAGES.LOGIN && <Login {...props} />}
            {page === PAGES.GAME && <Game {...props} />}
            {page === PAGES.START_GAME && <StartGame {...props} />}
        </>
    );
}

export default PageManager;