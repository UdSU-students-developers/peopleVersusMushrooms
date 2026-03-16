import React from 'react';
import PageManager from './pages/PageManager';
import Popup from './components/Popup/Popup';

import Server from './services/Server/Server';
import Store from './services/Store/Store';

import './App.css';
import Mediator from './services/Mediator/Mediator';
import CONFIG from './config';

export const MediatorContext = React.createContext<Mediator>(null!);
export const ServerContext = React.createContext<Server>(null!);
export const StorageContext = React.createContext<Store>(null!);

const App: React.FC = () => {

  const store = new Store();
  const mediator = new Mediator(CONFIG.MEDIATOR);
  const server = new Server({ store, mediator });

  const props = {
    mediator,
    server,
    store,
  }//Удалить в будущем, реализовать все через контексты

  const pressErrorHandler = () => mediator.get(
    CONFIG.MEDIATOR.TRIGGERS.ERROR,
    { code: 'Номер', text: 'текст' }
  )

  return (
    <div className="App">
      <MediatorContext.Provider value={mediator}>
        <ServerContext.Provider value={server}>
          <StorageContext.Provider value={store}>
            <div className='app'>
              <button onClick={pressErrorHandler}>КнопкаТестОшибки</button>
              <Popup />
              <PageManager {...props} />
            </div>
          </StorageContext.Provider>
        </ServerContext.Provider>
      </MediatorContext.Provider>
    </div>
  );
}

export default App;
