import React, { createContext, useEffect, useMemo, useState } from 'react';
import PageManager, { PAGES } from './pages/PageManager';
import { authStorage } from './utils/authStorage';
import Mediator from './services/Mediator/Mediator';
import Server from './services/server/Server';
import CONFIG from './config'
import useStore from './services/Store/useStore';
import { UIScaleProvider } from './widgets/UIScaleContext';

import './App.css';

export const MediatorContext = createContext<Mediator>(null!);
export const ServerContext = createContext<Server>(null!);

function App() {
  const [page, setPage] = useState<PAGES>(PAGES.LOGIN);

  const mediator = useMemo(() => new Mediator(CONFIG.MEDIATOR), []);
  useStore(mediator);
  const server = useMemo(() => new Server(mediator), [mediator]);

  useEffect(() => {


    const { token, user } = authStorage.getAuth();
    if (token && user) {
      const SET_STORE = mediator.getTriggerTypes().SET_STORE;
      mediator.get(SET_STORE, { name: 'user', value: user });
      setPage(PAGES.LOBBY);
    } else {
      setPage(PAGES.LOGIN);
    }
  }, [mediator]);

  return (
    <UIScaleProvider>
      <div className="App">
          <div className='app'>
            <PageManager 
              page={page} 
              setPage={setPage} 
              mediator={mediator} 
              server={server} 
            />
          </div>
      </div>
    </UIScaleProvider>
  );
}

export default App;