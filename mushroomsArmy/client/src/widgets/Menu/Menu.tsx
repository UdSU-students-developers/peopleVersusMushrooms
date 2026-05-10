import React, { useEffect, useState } from 'react';
import './Menu.css';

type UISize = 'small' | 'medium' | 'large';

interface MenuProps {
  isOpen: boolean;
  onExit: () => void;
}

const Menu: React.FC<MenuProps> = ({ isOpen, onExit }) => {
  const [uiSize, setUiSize] = useState<UISize>('medium');

  useEffect(() => {
    document.body.dataset.gameUiSize = uiSize;
  }, [uiSize]);

  if (!isOpen) return null;

  return (
    <div className="menu-dropdown">
      <p className="menu-title">ИНТЕРФЕЙС</p>
      
      <div className="size-toggle-buttons">
        <button 
          className={`menu-btn ${uiSize === 'small' ? 'active' : ''}`} 
          onClick={() => setUiSize('small')}
        >МАЛЕНЬКИЙ</button>

        <button 
          className={`menu-btn ${uiSize === 'medium' ? 'active' : ''}`} 
          onClick={() => setUiSize('medium')}
        >СТАНДАРТНЫЙ</button>

        <button 
          className={`menu-btn ${uiSize === 'large' ? 'active' : ''}`} 
          onClick={() => setUiSize('large')}
        >БОЛЬШОЙ</button>
      </div>

      <button className="menu-btn btn-exit-lobby" onClick={onExit}>ВЫХОД</button>
    </div>
  );
};

export default Menu;