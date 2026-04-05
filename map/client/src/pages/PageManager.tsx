import React, { useState } from 'react';
import Server from '../services/server/Server';
import Registration from './Registration/Registration';
import Login from './Login/Login';
import Chat from './Chat/Chat'
import Lobby from './Lobby/Lobby';
import MapPage from './Map/MapPage';
import Store from '../services/Store/Store';

import Mediator from '../services/Mediator/Mediator';
import { TError } from '../services/server/types';

export enum PAGES {
    LOGIN,
    REGISTRATION,
    CHAT,
    LOBBY,
    MAP
}

export interface IBasePage {
    setPage: (name: PAGES) => void;
}

export interface IPageManager {
    server: Server,
    store: Store,
    mediator: Mediator
}

const PageManager: React.FC<IPageManager> = ({ server, store, mediator }) => {
    const [page, setPage] = useState<PAGES>(PAGES.LOGIN);

    const props = {
        setPage,
        server,
        store,
        mediator
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
            {page === PAGES.MAP && <MapPage {...props} />}
        </>
    );
}

export default PageManager;