import React, { useContext, useState } from 'react';
import Server from '../services/server/Server';
import Registration from './Registration/Registration';
import Login from './Login/Login';
import Chat from './Chat/Chat';
import Store from '../services/Store/Store';
import Mediator from '../services/Mediator/Mediator';
import CONFIG from '../config';
import { MediatorContext, ServerContext } from '../App';

export enum PAGES {
    LOGIN,
    REGISTRATION,
    CHAT,
}

export interface IBasePage {
    setPage: (name: PAGES) => void;
    server: Server,
    mediator: Mediator,
}

const PageManager: React.FC = () => {
    const [page, setPage] = useState<PAGES>(PAGES.LOGIN);
    const mediator = useContext(MediatorContext);
    const server = useContext(ServerContext);


    const props = {
        setPage,
        server,
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