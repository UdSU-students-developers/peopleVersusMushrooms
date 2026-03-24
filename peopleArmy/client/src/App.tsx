import React from 'react';
import Server from './services/server/Server';
import Mediator from './services/Mediator/Mediator';
import useMediator from './services/Mediator/useMediator';
import useStore from './services/Store/useStore';
import PageManager from './pages/PageManager';
import './App.css';

export const MediatorContext = React.createContext<Mediator>(null!);
export const ServerContext = React.createContext<Server>(null!);

const App: React.FC = () => {
    const mediator = useMediator();
    useStore(mediator);
    const server = new Server(mediator);

    return (
        <MediatorContext value={mediator}>
            <ServerContext value={server}>
                <div className="App">
                    <div className='app'>
                        <PageManager />
                    </div>
                </div>
            </ServerContext>
        </MediatorContext>
    );
}

export default App;