import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

// Блокируем масштабирование страницы браузером через клавиатуру и колёсико
window.addEventListener('keydown', (e) => {
  if (
    e.ctrlKey && 
    (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '_')
  ) {
    e.preventDefault();
  }
});

window.addEventListener('wheel', (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
  }
}, { passive: false });

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
