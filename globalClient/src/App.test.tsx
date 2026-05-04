import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('до входа показывается выбор сервера (роли)', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /сервер/i })).toBeInTheDocument();
  expect(screen.getByRole('radiogroup', { name: /роль/i })).toBeInTheDocument();
});
