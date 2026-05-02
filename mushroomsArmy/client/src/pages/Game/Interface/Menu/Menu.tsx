import React, { useEffect, useState } from 'react';
import './Menu.css';


type UISize = 'small' | 'medium' | 'large';

interface MenuProps {
  isOpen: boolean;
  onExit: () => void;
}

const Menu: React.FC<MenuProps> = ({ isOpen, onExit }) => {
  // Устанавливаем 'medium' как стандарт, чтобы соответствовать твоему :root в CSS
  const [uiSize, setUiSize] = useState<UISize>('medium');

  useEffect(() => {
    // Применяем размер к body
    document.body.dataset.gameUiSize = uiSize;
    
    console.log(`UI Scale changed to: ${uiSize}`);
  }, [uiSize]);

  if (!isOpen) return null;

return (
  <div className="menu-dropdown">
    <div className="menu-content">
      <div className="menu-section">
        <p className="section-title">РАЗМЕР ИНТЕРФЕЙСА</p>
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

        {/* Кнопка выхода внутри секции */}
        <button className="menu-btn btn-exit-lobby" onClick={onExit}>ВЫХОД</button>

      </div>
    </div>
  </div>
);
};

export default Menu;