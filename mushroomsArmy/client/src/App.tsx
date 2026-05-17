import React, { createContext, useEffect, useMemo, useState } from 'react';
import PageManager, { PAGES } from './pages/PageManager';
import { authStorage } from './utils/authStorage';
import Mediator from './services/Mediator/Mediator';
import Server from './services/server/Server';
import CONFIG from './config'
import useStore from './services/Store/useStore';
import { UI_SCALE_STEPS } from './widgets/uiConstants';

import './App.css';

export const MediatorContext = createContext<Mediator>(null!);
export const ServerContext = createContext<Server>(null!);

function App() {
  const [page, setPage] = useState<PAGES>(PAGES.LOGIN);

  const mediator = useMemo(() => new Mediator(CONFIG.MEDIATOR), []);
  useStore(mediator);
  const server = useMemo(() => new Server(mediator), [mediator]);

  useEffect(() => {

    const config = UI_SCALE_STEPS[2]; // M по умолчанию
  
    const root = document.documentElement;
    root.style.setProperty('--header-height', `${config.headerHeight}px`);
    root.style.setProperty('--font-base', `${config.baseFont}px`);
    root.style.setProperty('--title-font-size', `${config.titleFont}px`);

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
  );
}

export default App;