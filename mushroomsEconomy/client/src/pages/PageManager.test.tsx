import { render, screen, fireEvent } from '@testing-library/react';
import PageManager, { PAGES as mockPAGES } from './PageManager';

jest.mock('./Registration/Registration', () => {
  return function MockRegistration({ setPage }: { setPage: (page: mockPAGES) => void }) {
    return <button onClick={() => setPage(mockPAGES.LOGIN)}>Перейти ко входу</button>;
  };
});

jest.mock('./Login/Login', () => {
  return function MockLogin({ setPage }: { setPage: (page: mockPAGES) => void }) {
    return (
      <div>
        <button onClick={() => setPage(mockPAGES.REGISTRATION)}>Перейти к регистрации</button>
        <button onClick={() => setPage(mockPAGES.START_GAME)}>Начать игру</button>
      </div>
    );
  };
});

jest.mock('./Game/Game', () => {
  return function MockGame({ setPage }: { setPage: (page: mockPAGES) => void }) {
    return <button onClick={() => setPage(mockPAGES.LOGIN)}>Назад ко входу</button>;
  };
});

jest.mock('./LobbyMenu/LobbyMenu', () => {
  return function MockLobbyMenu({ setPage }: { setPage: (page: mockPAGES) => void }) {
    return <button onClick={() => setPage(mockPAGES.GAME)}>Войти в игру</button>;
  };
});

describe('PageManager', () => {
  test('по умолчанию отображает страницу входа', () => {
    render(<PageManager />);
    expect(screen.getByText('Перейти к регистрации')).toBeInTheDocument();
    // Ожидаем, что кнопка "Перейти к регистрации" присутствует в документе
  });

  test('переходит на страницу регистрации при нажатии на кнопку входа', () => {
    render(<PageManager />);
    fireEvent.click(screen.getByText('Перейти к регистрации'));
    expect(screen.getByText('Перейти ко входу')).toBeInTheDocument();
    //Ожидаем что кнопка "Перейти ко входу" присутствует в документе
    expect(screen.queryByText('Перейти к регистрации')).not.toBeInTheDocument();
    //ожидаем что кнопка "Перейти к регистрации" отсутствует в документе
  });

  test('переходит с регистрации обратно ко входу', () => {
    render(<PageManager />);
    fireEvent.click(screen.getByText('Перейти к регистрации'));
    fireEvent.click(screen.getByText('Перейти ко входу'));   
    expect(screen.getByText('Перейти к регистрации')).toBeInTheDocument();
    //Ожидаем что кнопка "Перейти к регистрации" присутствует в документе
  });

  test('переходит на страницу старта игры, а затем в игру', () => {
    render(<PageManager />);
    fireEvent.click(screen.getByText('Начать игру'));
    expect(screen.getByText('Войти в игру')).toBeInTheDocument();
    //Ожидаем что кнопка "Войти в игру" присутствует в документе

    fireEvent.click(screen.getByText('Войти в игру'));
    expect(screen.getByText('Назад ко входу')).toBeInTheDocument();
    //ожидаем что кнопка "Назад ко входу" присутствует в документе
  });

  test('возвращается ко входу из игры', () => {
    render(<PageManager />);
    fireEvent.click(screen.getByText('Начать игру'));
    fireEvent.click(screen.getByText('Войти в игру'));
    fireEvent.click(screen.getByText('Назад ко входу'));
    expect(screen.getByText('Перейти к регистрации')).toBeInTheDocument();
    //ожидаем что кнопка "Перейти к регистрации" присутствует в документе
  });
});