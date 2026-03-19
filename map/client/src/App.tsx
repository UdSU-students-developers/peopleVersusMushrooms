import Store from './services/Store/Store';
import Server from './services/server/Server';
import PageManager from './pages/PageManager';
import Mediator from './services/Mediator/Mediator';
import './App.css';
import { MEDIATOR } from './config';

function App() {
  // mediator
  const mediator = new Mediator({ EVENTS: MEDIATOR.EVENTS, TRIGGERS: MEDIATOR.TRIGGERS });
  const store = new Store(mediator);
  const server = new Server(mediator);

  const props = {
    mediator,
    server,
    store,
  }

  server.check('ВАСИЛИЙ', 'Я на такое не подписывался!');

  return (
    <div className="App">
      <div className='app'>
        <PageManager {...props} />
      </div>
    </div>
  );
}

export default App;
