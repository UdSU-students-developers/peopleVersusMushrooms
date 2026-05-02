import React, { useState } from 'react';
import './Header.css';
import Menu from '../Menu/Menu'; 

interface HeaderProps {
  username: string;
  onExit: () => void;
}

const Header: React.FC<HeaderProps> = ({ username, onExit }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="game-header">


      <div className="header-left">
        <span className="user-nickname">{username}</span>
      </div>
      
      <div className="header-center">
        <h1 className="game-title">Армия грибов</h1>
      </div>
      



      <div className="header-right">
        <button 
          id="header-menu-btn" 
          className="menu-button" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          МЕНЮ
        </button>

        <Menu 
          isOpen={isMenuOpen} 
          onExit={onExit} 
        />
      </div>
    </header>
  );
};

export default Header;