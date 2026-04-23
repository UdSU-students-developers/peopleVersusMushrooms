import { describe, test, expect } from '@jest/globals';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import Registration from './Registration';
import { ServerContext, MediatorContext } from '../../App';

const serverMock = {} as any;

const mediatorMock = {
  getEventTypes: () => ({ REGISTRATION: 'REGISTRATION' }),
  subscribe: () => {},
  unsubscribe: () => {},
} as any;

function renderRegistration() {
  return render(
    <ServerContext.Provider value={serverMock}>
      <MediatorContext.Provider value={mediatorMock}>
        <Registration setPage={jest.fn()} />
      </MediatorContext.Provider>
    </ServerContext.Provider>
  );
}

describe('Registration markup', () => {
  test('renders all registration UI elements', () => {
    renderRegistration();

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Регистрация');

    expect(screen.getByPlaceholderText('Логин')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Повтор пароля')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Имя игрока')).toBeInTheDocument();

    expect(screen.getByLabelText('Отключить проверки')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Создать/i })).toBeInTheDocument();

    expect(screen.getByText('Уже есть аккаунт? Войти')).toBeInTheDocument();
  });
});