import React from 'react';

import Server from './services/Server/Server';
import Mediator from './services/Mediator/Mediator';

import PageManager from './pages/PageManager';
import Popup from './components/Popup/Popup';

import useMediator from './services/Mediator/useMediator';
import useStore from './services/Store/useStore';

import './App.css';


export const MediatorContext = React.createContext<Mediator>(null!);
export const ServerContext = React.createContext<Server>(null!);

function App() {

  const mediator = useMediator();
  useStore(mediator);
  const server = new Server(mediator);


  return (
    <div className="App">
      <MediatorContext.Provider value={mediator}>
        <ServerContext.Provider value={server}>
          <div className='app'>
            <PageManager />
            <Popup />
          </div>
        </ServerContext.Provider>
      </MediatorContext.Provider>
    </div>
  );
}

export default App;
