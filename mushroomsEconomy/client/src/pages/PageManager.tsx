import React, { useContext, useState } from 'react';
import Registration from './Registration/Registration';
import Login from './Login/Login';
import Chat from './Chat/Chat'
import Game from './Game/Game';

import CONFIG from '../config';


export enum PAGES {
    LOGIN,
    REGISTRATION,
    CHAT,
    GAME,
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
            {page === PAGES.CHAT && <Chat {...props} />}
            {page === PAGES.GAME && <Game {...props} />}
        </>
    );
}

export default PageManager;