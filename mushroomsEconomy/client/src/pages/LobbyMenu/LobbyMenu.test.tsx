import { render, screen } from '@testing-library/react';
import React from 'react';
import LobbyMenu from './LobbyMenu';
import { ServerContext, MediatorContext } from '../../App';
import '@testing-library/jest-dom'

const mediatorMock = {
  get: jest.fn(() => ({ name: 'TestPlayer', guid: '123' })),
  getEventTypes: () => ({}),
  subscribe: () => {},
  unsubscribe: () => {},
} as any;

const serverMock = {
  getLobbies: jest.fn(),
} as any;

function renderLobbyMenu() {
  return render(
    <ServerContext.Provider value={serverMock}>
      <MediatorContext.Provider value={mediatorMock}>
        <LobbyMenu setPage={jest.fn()} />
      </MediatorContext.Provider>
    </ServerContext.Provider>
  );
}

describe('LobbyMenu markup', () => {
  test('renders lobby list UI', () => {
    renderLobbyMenu();

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Доступные лобби');

    expect(screen.getByText('Нет доступных лобби')).toBeInTheDocument();

    expect(screen.getByPlaceholderText('Название лобби')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Создать/i })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Назад/i })).toBeInTheDocument();
  });
});