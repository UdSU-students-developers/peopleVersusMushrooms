import React from 'react';
import './GameOver.css';

interface GameOverProps {
  onRestart: () => void;
  onExit: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ onRestart, onExit }) => {
  return (
    <div className="game-overlay">
      <div className="game-overlay-content">
        <h2>ИГРА ОКОНЧЕНА</h2>
        <div className="game-overlay-actions">
          <button 
            type="button" 
            className="game-btn" 
            onClick={onRestart}
          >
            НАЧАТЬ ЗАНОВО
          </button>
          
          <button 
            type="button" 
            className="game-btn-secondary" 
            onClick={onExit}
          >
            В ЛОББИ
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;