import Store from './services/Store/Store';
import Server from './services/server/Server';
import PageManager from './pages/PageManager';

import './App.css';

function App() {
  // mediator
  const store = new Store();
  const server = new Server();

  server.check('ВАСИЛИЙ', 'Я на такое не подписывался!');

  return (
    <div className="App">
        <div className='app'>
          <PageManager />
        </div>
    </div>
  );
}

export default App;
