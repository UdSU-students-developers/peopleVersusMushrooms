import React, { useState, useMemo } from 'react';
import Server from '../services/server/Server';
import Registration from './Registration/Registration';
import Login from './Login/Login';
import Chat from './Chat/Chat'
import Lobby from './Lobby/Lobby';
import Store from '../services/Store/Store';
import CONFIG from '../config';
import Mediator from '../services/Mediator/Mediator';
import useStore from '../services/Store/useStore';


export enum PAGES {
    LOGIN,
    REGISTRATION,
    CHAT,
    LOBBY,
}

export interface IBasePage {
    setPage: (name: PAGES) => void;
    server: Server,
    store: Store,
}

const PageManager: React.FC = () => {
    const [page, setPage] = useState<PAGES>(PAGES.LOGIN);
    const mediator = useMemo(() => new Mediator(CONFIG.MEDIATOR), []);
    const store = useStore(mediator);
    const server = useMemo(() => new Server(mediator), [mediator]);

    const props = {
        setPage,
        server,
        store,
    }

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