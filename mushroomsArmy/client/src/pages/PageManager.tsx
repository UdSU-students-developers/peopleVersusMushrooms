import React from 'react';
import Registration from './Registration/Registration';
import Login from './Login/Login';
import Lobby from './Lobby/Lobby';
import Game from './Game/Game';
import { MediatorContext, ServerContext } from '../App';
import Mediator from '../services/Mediator/Mediator';
import Server from '../services/server/Server';


export enum PAGES {
    LOGIN,
    REGISTRATION,
    LOBBY,
    GAME,
}

interface IPageManagerProps {
    page: PAGES;
    setPage: (page: PAGES) => void;
    mediator: Mediator;
    server: Server;
}

const PageManager: React.FC<IPageManagerProps> = ({page, setPage, mediator, server}) => {

    return (
        <MediatorContext.Provider value={mediator}>
            <ServerContext.Provider value={server}>
                {page === PAGES.REGISTRATION && <Registration setPage={setPage} />}
                {page === PAGES.LOGIN && <Login setPage={setPage} />}
                {page === PAGES.LOBBY && <Lobby setPage={setPage} />}
                {page === PAGES.GAME && <Game setPage={setPage} />}
            </ServerContext.Provider>
        </MediatorContext.Provider>
    );
}

export default PageManager;