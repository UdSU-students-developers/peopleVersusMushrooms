import React, { createContext } from 'react';

import Store from './services/Store/Store';
import Server from './services/server/Server';
import PageManager from './pages/PageManager';
import useMediator from './services/Mediator/useMediator';
import Mediator from './services/Mediator/Mediator';

import './App.css';

export const MediatorContext = createContext<Mediator>(null!);

const App: React.FC = () => {
  // mediator
  const mediator = useMediator();
  const store = new Store(mediator);
  const server = new Server(mediator);

  const props = {
    server,
    store,
  }

  server.check('ВАСИЛИЙ', 'Я на такое не подписывался!');

  return (
    <MediatorContext value={mediator}>
      <div className="App">
        <div className='app'>
          <PageManager {...props} />
        </div>
      </div>
    </MediatorContext>
  );
}

export default App;
