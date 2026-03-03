import React, { useState } from 'react';
import Server from '../services/server/Server';
import Registration from './Registration/Registration';
import Login from './Login/Login';
import Chat from './Chat/Chat'
import Store from '../services/Store/Store';


export enum PAGES {
    LOGIN,
    REGISTRATION,
    CHAT,
}

export interface IBasePage {
    setPage: (name: PAGES) => void;
    server: Server,
    store: Store,
}

const PageManager: React.FC = () => {
    const [page, setPage] = useState<PAGES>(PAGES.LOGIN);
    const store = new Store();
    const server = new Server(store);

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
        </>
    );
}

export default PageManager;