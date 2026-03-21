import React, { useState, useEffect } from 'react';
import Server from '../services/server/Server';
import Registration from './Registration/Registration';
import Login from './Login/Login';
import Chat from './Chat/Chat';
import Store from '../services/Store/Store';
import Mediator from '../services/Mediator/Mediator';
import SocketService from '../services/SocketService';
import CONFIG from '../config';

export enum PAGES {
    LOGIN,
    REGISTRATION,
    CHAT,
}

export interface IBasePage {
    setPage: (name: PAGES) => void;
    server: Server,
    store: Store,
    mediator: Mediator,
}

const PageManager: React.FC = () => {
    const [page, setPage] = useState<PAGES>(PAGES.LOGIN);
    const store = new Store();
    const server = new Server(store);

    const [mediator] = useState(() => new Mediator({
        EVENTS: CONFIG.MEDIATOR.EVENTS,
        TRIGGERS: CONFIG.MEDIATOR.TRIGGERS,
    }));

    useEffect(() => {
        SocketService.connect();
        
        return () => {
            SocketService.disconnect();
        };
    }, []);

    const props = {
        setPage,
        server,
        store,
        mediator,
    }

    return (
        <>
            {page === PAGES.REGISTRATION && <Registration {...props} />}
            {page === PAGES.LOGIN && <Login {...props} />}
            {page === PAGES.CHAT && <Chat {...props} />}
        </>
    );
}

export default PageManager;