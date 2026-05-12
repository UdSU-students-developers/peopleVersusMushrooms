import React from "react";
import './OptionsPannel.css';

interface OptionsPannelProps {
  currentStep: number;
  topOffset: number;
  panelSize?: number;
  isOpen: boolean;
  onStepChange: (nextStep: number) => void;
  onClose: () => void;
  onSurrender: () => void;
}

const DEFAULT_PANEL_SIZE = 280;

function OptionsPannel({
  currentStep,
  topOffset,
  panelSize = DEFAULT_PANEL_SIZE,
  isOpen,
  onStepChange,
  onClose,
  onSurrender,
}: OptionsPannelProps) {
  const totalSteps = 5;

  return (
    <div
      className={`options-pannel-container ${isOpen ? 'is-open' : 'is-closed'}`}
      style={
        {
          top: `${topOffset}px`,
          right: 0,
          '--options-panel-size': `${panelSize}px`,
        } as React.CSSProperties
      }
    >
      <button type="button" className="options-close-button" onClick={onClose} aria-label="Close menu">
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
          value={currentStep}
          className="hud-scale-slider"
          onChange={(event) => onStepChange(Number(event.target.value))}
        />

        <div className="scale-dots-group">
          {[...Array(totalSteps)].map((_, index) => (
            <div
              key={index}
              className={`scale-dot ${index === currentStep ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>

      <button type="button" className="options-surrender-button" onClick={onSurrender}>
        СДАТЬСЯ
      </button>
    </div>
  );
}

export default OptionsPannel;
