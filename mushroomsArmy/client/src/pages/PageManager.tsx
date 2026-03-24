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
import { MediatorContext, ServerContext } from '../App';


export enum PAGES {
    LOGIN,
    REGISTRATION,
    CHAT,
    LOBBY,
}

const PageManager: React.FC = () => {
    const [page, setPage] = useState<PAGES>(PAGES.LOGIN);
    const mediator = useMemo(() => new Mediator(CONFIG.MEDIATOR), []);
    const store = useStore(mediator);
    const server = useMemo(() => new Server(mediator), [mediator]);

    return (
        <MediatorContext.Provider value={mediator}>
            <ServerContext.Provider value={server}>
                {page === PAGES.REGISTRATION && <Registration setPage={setPage} />}
                {page === PAGES.LOGIN && <Login setPage={setPage} />}
                {page === PAGES.CHAT && <Chat setPage={setPage} />}
                {page === PAGES.LOBBY && <Lobby setPage={setPage} />}
            </ServerContext.Provider>
        </MediatorContext.Provider>
    );
}

export default PageManager;