import React, { useEffect, useState } from 'react';

import Server from './services/Server/Server';
import Mediator from './services/Mediator/Mediator';
import GameProcess from './Game/GameProcess';
import RoleSelect from './pages/RoleSelect/RoleSelect';

import PageManager from './pages/PageManager';
import Popup from './components/Popup/Popup';

import useMediator from './services/Mediator/useMediator';
import useStore from './services/Store/useStore';

import type { GameRole } from './config';
import CONFIG from './config';

import './App.css';


export const MediatorContext = React.createContext<Mediator>(null!);
export const ServerContext = React.createContext<Server>(null!);
export const GameContext = React.createContext<GameProcess>(null!);

function ConnectedApp({
    mediator,
    role,
    onClearRole,
}: {
    mediator: Mediator;
    role: GameRole;
    onClearRole: () => void;
}) {
    const [{ server, game }] = useState(() => {
        const s = new Server(mediator);
        const g = new GameProcess(s, mediator);
        return { server: s, game: g };
    });
    const host = CONFIG.HOST_BY_ROLE[role];

    useEffect(() => {
        server.connect(host);
        return () => {
            server.disconnect();
        };
    }, [server, host]);

    const handleChangeRole = () => {
        server.disconnect();
        onClearRole();
    };

    return (
        <ServerContext.Provider value={server}>
            <GameContext.Provider value={game}>
                <div className="app">
                    <PageManager onChangeRole={handleChangeRole} />
                    <Popup />
                </div>
            </GameContext.Provider>
        </ServerContext.Provider>
    );
}

function App() {

    const mediator = useMediator();
    useStore(mediator);
    const [role, setRole] = useState<GameRole | null>(null);

    return (
        <div className="App">
            <MediatorContext.Provider value={mediator}>
                {role === null ? (
                    <RoleSelect onSelectRole={(r) => setRole(r)} />
                ) : (
                    <ConnectedApp mediator={mediator} role={role} onClearRole={() => setRole(null)} />
                )}
            </MediatorContext.Provider>
        </div>
    );
}

export default App;
