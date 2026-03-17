import React from 'react';
import PageManager from './pages/PageManager';
import Popup from './components/Popup/Popup';

import Server from './services/Server/Server';
import Store from './services/Store/Store';
import useMediator from './services/Mediator/useMediator';
import useStore from './services/Store/useStore';

import './App.css';
import CONFIG from './config';

export const MediatorContext = React.createContext<any>(null!);

function App() {
  const mediator = useMediator();
  const store = useStore(mediator);

  const server = new Server(mediator);

  const pressMeHandler = () => mediator.get(
    CONFIG.MEDIATOR.TRIGGERS.MESSAGE,
    { name: 'Vasya', text: 'something' }
  );

  const props = {
    mediator,
    server,
    store,
  }

  return (
      <MediatorContext.Provider value={mediator}>
          <div className="App">
            <button onClick={pressMeHandler}>Press Me</button>
            <div className='app'>
              <PageManager {...props}/>
            </div>
          </div>
      </MediatorContext.Provider>
  );
}

export default App;
