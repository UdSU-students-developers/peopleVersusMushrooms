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
  gameTitle = "Армия грибов", 
  isMenuOpen,
  onMenuToggle 
}) => {
  return (
    <header className="game-header">
      <div className="header-left">
        <span className="user-nickname">{username}</span>
      </div>
      
      <div className="header-center">
        <h1 className="game-title">{gameTitle}</h1>
      </div>

      <div className="header-right">
        <button 
          id="header-menu-btn" 
          className={`menu-button ${isMenuOpen ? 'active' : ''}`} 
          onClick={onMenuToggle}
        >
          МЕНЮ
        </button>
     
      </div>
    </header>
  );
};

export default Header;