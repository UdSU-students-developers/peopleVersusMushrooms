import React, { useContext, useState } from 'react';
import { MediatorContext } from '../App';
import Registration from './Registration/Registration';
import Login from './Login/Login';
import Chat from './Chat/Chat'
import Lobby from './Lobby/Lobby';
import { TError } from '../services/server/types';

export enum PAGES {
    LOGIN,
    REGISTRATION,
    CHAT,
    LOBBY
}

export interface IBasePage {
    setPage: (name: PAGES) => void;
}

const PageManager: React.FC = () => {
    const mediator = useContext(MediatorContext);
    const [page, setPage] = useState<PAGES>(PAGES.LOGIN);

    const props = {
        setPage
    }

    const { SHOW_ERROR } = mediator.getEventTypes();
    mediator.subscribe(SHOW_ERROR, (data: TError) => {
        console.log(data);
    });

    return (
        <>
            {page === PAGES.REGISTRATION && <Registration {...props} />}
            {page === PAGES.LOGIN && <Login {...props} />}
            {page === PAGES.CHAT && <Chat {...props} />}
            {page === PAGES.LOBBY && <Lobby {...props} />}
        </>
    );
}

export default PageManager;