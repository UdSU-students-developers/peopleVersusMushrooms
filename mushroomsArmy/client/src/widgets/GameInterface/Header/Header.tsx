import React from 'react';
import './Header.css';

interface HeaderProps {
  username: string;
  gameTitle?: string;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({
  username,
  gameTitle = 'MUSHROOMS ARMY',
  isMenuOpen,
  onMenuToggle,
}) => {
  return (
    <header className="header-strip" style={{ height: 'var(--header-height)' }}>
      <div className="header-safe-area">
        <div className="header-section left" style={{ fontSize: 'var(--font-base)' }}>
          <span className="user-nickname">{username}</span>
        </div>

        <div className="header-section center" style={{ fontSize: 'var(--title-font-size)' }}>
          <h1 className="game-title">{gameTitle}</h1>
        </div>

        <div className="header-section right">
          <button
            type="button"
            id="header-menu-btn"
            className={`menu-button ${isMenuOpen ? 'active' : ''}`}
            style={{ fontSize: 'var(--font-base)' }}
            onClick={onMenuToggle}
          >
            MENU
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
