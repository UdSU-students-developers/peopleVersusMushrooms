import React, { createContext } from 'react';
import PageManager from './pages/PageManager';

import './App.css';

export const MediatorContext = createContext<any>(null!);
export const ServerContext = createContext<any>(null!);

function App() {
  return (
    <div className="App">
        <div className='app'>
          <PageManager />
        </div>
    </div>
  );
}

export default App;
