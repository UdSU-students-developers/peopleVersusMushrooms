// widgets/Header/Header.tsx

import React from 'react';
import './Header.css';

interface HeaderProps {
  variant: 'auth' | 'lobby' | 'hud';
  nickname?: string;           // имя пользователя (для lobby/hud)
  isMenuOpen?: boolean;        // открыто ли меню (для стилизации кнопки)
  onMenuClick?: () => void;    // обработчик клика по кнопке меню
}

const Header: React.FC<HeaderProps> = ({
  variant,
  nickname,
  isMenuOpen = false,
  onMenuClick,
}) => {
  // Определяем, показывать ли левую секцию с ником
  const showLeftSection = variant !== 'auth';  
  // Центральный текст всегда одинаковый
  const centerText = 'mushrooms army';
  // Кнопка меню есть всегда
  const showMenuButton = true;
  
  return (
    <header className={`header header--${variant}`}>

      <div className="header__safe-area">
        
        {/* Левая секция — ник игрока (только для lobby/hud) */}
        {showLeftSection && (
          <div className="header__section header__section--left">
            <span 
              className="header__nickname"
              style={{ fontSize: 'var(--font-base)' }}
            >
              {nickname || ''}
            </span>
          </div>
        )}
        
        {/* Центральная секция — название игры (всегда) */}
        <div className="header__section header__section--center">
          <h1 
            className="header__title"
            style={{ fontSize: 'var(--title-font-size)' }}
          >
            {centerText}
          </h1>
        </div>
        
        {/* Правая секция — кнопка меню (всегда) */}
        <div className="header__section header__section--right">
          {showMenuButton && (
            <button
              type="button"
              className={`header__menu-button ${isMenuOpen ? 'header__menu-button--active' : ''}`}
              style={{ fontSize: 'var(--font-base)' }}
              onClick={onMenuClick}
            >
              MENU
            </button>
          )}
        </div>
        
      </div>
    </header>
  );
};

export default Header;