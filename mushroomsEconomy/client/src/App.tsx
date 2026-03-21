import React from 'react';
import CONFIG from './config';
import Server from './services/Server/Server';
import Store from './services/Store/Store';
import useStore from './services/Store/useStore';
import Mediator from './services/Mediator/Mediator';
import useMediator from './services/Mediator/useMediator';

import PageManager from './pages/PageManager';

import './App.css';

export const MediatorContext = React.createContext<Mediator>(null!);
export const ServerContext = React.createContext<Server>(null!);

const { MEDIATOR } = CONFIG;

const App: React.FC = () => {
    const mediator = useMediator();
    useStore(mediator);
    const server = new Server(mediator);

    const pressMeHandler = () => mediator.get(
        MEDIATOR.TRIGGERS.MESSAGE,
        { name: 'Vasya', text: 'something' }
    );

    return (
        <MediatorContext value={mediator}>
            <ServerContext value={server}>
            <div className="App">
                <button onClick={pressMeHandler}>Press Me</button>
                <div className='app'>
                    <PageManager />
                </div>
            </div>
            </ServerContext>
        </MediatorContext>
    );
}

export default App;
