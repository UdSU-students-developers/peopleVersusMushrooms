import React from 'react';
import { useUIScale } from '../UIScaleContext';
import { UI_SCALES } from '../uiScales';
import { HeaderScale } from '../Header/types';
import './OptionsPannel.css';

interface OptionsPannelProps {
  variant: 'auth' | 'lobby' | 'hud';
  isOpen: boolean;
  onClose: () => void;
    onExit?: () => void;        // для lobby — выход из аккаунта
  onSurrender?: () => void;   // для hud — сдаться
}

const OptionsPannel: React.FC<OptionsPannelProps> = ({ variant, isOpen, onClose, onExit, onSurrender }) => {
  const { scale, setScale } = useUIScale();
  
  const scales = Object.keys(UI_SCALES) as HeaderScale[];
  const currentIndex = scales.indexOf(scale);
  const totalSteps = scales.length;
  
  const handleScaleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = Number(event.target.value);
    setScale(scales[newIndex]);
  };
  
  return (
    <div
      className={`options-pannel-container options-pannel-container--${variant} ${isOpen ? 'is-open' : 'is-closed'}`}
      style={{
        top: 'var(--header-height)',
        right: 0,
        '--options-panel-size': '280px',
      } as React.CSSProperties}
    >
      <button type="button" className="options-close-button" onClick={onClose}>
        x
      </button>

      <div className="options-controls">
        <div className="options-settings-title">НАСТРОЙКИ</div>
        <div className="options-title">РАЗМЕР ИНТЕРФЕЙСА</div>

        <input
          type="range"
          min="0"
          max={totalSteps - 1}
          step="1"
          value={currentIndex}
          className="hud-scale-slider"
          onChange={handleScaleChange}
        />

        <div className="scale-dots-group">
          {scales.map((s, index) => (
            <div
              key={s}
              className={`scale-dot ${index === currentIndex ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>
      {/* Кнопка в зависимости от variant */}
      {variant === 'lobby' && onExit && (
        <button type="button" className="options-exit-button" onClick={onExit}>
          выйти из аккаунта
        </button>
      )}
      {variant === 'hud' && onSurrender && (
        <button type="button" className="options-surrender-button" onClick={onSurrender}>
          СДАТЬСЯ
        </button>
      )}
    </div>
  );
};

export default OptionsPannel;