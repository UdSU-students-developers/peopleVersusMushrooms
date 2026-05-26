import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./services/Mediator/useMediator');
jest.mock('./services/Store/useStore');
jest.mock('./services/Server/Server');
jest.mock('./Game/GameProcess');
jest.mock('./pages/PageManager', () => () => <div data-testid="page-manager" />);
jest.mock('./components/Popup/Popup', () => () => <div data-testid="popup">Popup</div>);

import useMediator from './services/Mediator/useMediator';
import useStore from './services/Store/useStore';
import Server from './services/Server/Server';
import GameProcess from './Game/GameProcess';

const mockMediator = { id: 'mediator-instance' };
const mockServer = { id: 'server-instance' };
const mockGame = { id: 'game-instance' };

describe('Приложение', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useMediator as jest.Mock).mockReturnValue(mockMediator);
    (useStore as jest.Mock).mockImplementation(() => {});
    (Server as jest.Mock).mockImplementation(() => mockServer);
    (GameProcess as jest.Mock).mockImplementation(() => mockGame);
  });

  it('рендерится без ошибок и содержит ключевые компоненты', () => {
    render(<App />);
    expect(screen.getByTestId('page-manager')).toBeInTheDocument();
    expect(screen.getByTestId('popup')).toBeInTheDocument();
  });

  it('создаёт Server и GameProcess с mediator из useMediator', () => {
    render(<App />);
    expect(Server).toHaveBeenCalledTimes(1);
    expect(GameProcess).toHaveBeenCalledTimes(1);
    expect(Server).toHaveBeenCalledWith(mockMediator);
    expect(GameProcess).toHaveBeenCalledWith(mockServer, mockMediator);
  });

  it('вызывает useStore с mediator', () => {
    render(<App />);
    expect(useStore).toHaveBeenCalledWith(mockMediator);
  });
});