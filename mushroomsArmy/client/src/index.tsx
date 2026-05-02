import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

// 1. Блокировка Ctrl + (+), Ctrl + (-)
window.addEventListener('keydown', (e) => {
  if (
    e.ctrlKey && 
    (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '_')
  ) {
    e.preventDefault();
  }
});

// 2. Блокировка Ctrl + колесико мыши
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
