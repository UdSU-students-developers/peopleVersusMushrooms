import { describe, test, expect } from '@jest/globals';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import Login from './Login';
import { ServerContext, MediatorContext } from '../../App';
import '@testing-library/jest-dom'

const serverMock = {} as any;
const mediatorMock = {
  getEventTypes: () => ({ LOGIN: 'LOGIN' }),
  subscribe: () => {},
  unsubscribe: () => {},
} as any;

function renderLogin() {
  return render(
    <ServerContext.Provider value={serverMock}>
      <MediatorContext.Provider value={mediatorMock}>
        <Login setPage={jest.fn()} />
      </MediatorContext.Provider>
    </ServerContext.Provider>
  );
}

describe('Login markup', () => {
  test('renders basic login UI elements', () => {
    renderLogin();

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Вход');

    expect(screen.getByPlaceholderText('Логин')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument();

    expect(screen.getByLabelText('Запомнить меня')).toBeInTheDocument();
    expect(screen.getByLabelText('Отключить проверки')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Войти/i })).toBeInTheDocument();

    expect(screen.getByText('Забыли пароль?')).toBeInTheDocument();
    expect(screen.getByText('Нет аккаунта? Зарегистрироваться')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Войти/i })).toBeDisabled();
  });
});