import React, { useContext, useEffect, useState } from 'react';
import { MediatorContext } from '../../../App';
import CONFIG from '../../../config';
import Minimap from '../MiniMap/Minimap';
import './Footer.css';
import { GameState, TCamera } from '../../../pages/Game/types';
import { camera as globalCamera } from '../../../utils/camera';

const Footer: React.FC = () => {
  const mediator = useContext(MediatorContext);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [cameraState, setCameraState] = useState<TCamera>({ ...globalCamera });

  useEffect(() => {
    if (!mediator) return;

    const handler = (newState: GameState) => {
      setGameState(newState);
    };
    mediator.subscribe(CONFIG.MEDIATOR.EVENTS.GAME_STATE_UPDATED, handler);

    const interval = setInterval(() => {
      setCameraState({
        offsetX: globalCamera.offsetX,
        offsetY: globalCamera.offsetY,
        scale: globalCamera.scale,
        isDragging: globalCamera.isDragging,
        lastMouseX: globalCamera.lastMouseX,
        lastMouseY: globalCamera.lastMouseY,
      });
    }, 16);

    return () => {
      mediator.unsubscribe(CONFIG.MEDIATOR.EVENTS.GAME_STATE_UPDATED, handler);
      clearInterval(interval);
    };
  }, [mediator]);

  return (
    <footer className="game-footer-wrapper">
      <div className="minimap-container">
        <Minimap gameState={gameState} camera={cameraState} />
      </div>

      <div className="game-footer-main-panel" />
    </footer>
  );
};

export default Footer;
