// pages/Game/Game.tsx
import React, { useEffect, useRef, useState, useContext } from 'react';
import { MediatorContext } from '../../App';
import CONFIG from '../../config';
import { drawGame } from './renderer';
import { GameState } from './types';
import { PAGES } from '../PageManager';
import './Game.css';

const Game: React.FC<{ setPage: (page: PAGES) => void }> = ({ setPage }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const mediator = useContext(MediatorContext);
  const [isGameOver, setIsGameOver] = useState(false);

  const GET_STORE = mediator.getTriggerTypes().GET_STORE;
  const user = mediator.get(GET_STORE, 'user');
  const username = user?.name || user?.username || 'Игрок';

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const widthCSS = canvas.clientWidth;
    const heightCSS = canvas.clientHeight;
    if (widthCSS === 0 || heightCSS === 0) return;

    drawGame(ctx, gameStateRef.current, widthCSS, heightCSS);
  };

  // Настройка canvas и ресайза
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (displayWidth === 0 || displayHeight === 0) return;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        redrawCanvas();
      }
    };

    resizeCanvas();

    let rafId: number | null = null;
    const handleResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        resizeCanvas();
        rafId = null;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Подписка на обновления игрового состояния
  useEffect(() => {
    if (!mediator) return;

    const EVENT_NAME = CONFIG.MEDIATOR.EVENTS.GAME_STATE_UPDATED;
    const handler = (newState: GameState) => {
      console.log('[Game] State updated', newState);
      gameStateRef.current = newState;
      redrawCanvas();
    };

    mediator.subscribe(EVENT_NAME, handler);

    return () => {
      mediator.unsubscribe(EVENT_NAME, handler);
    };
  }, [mediator]);

  // Подписка на окончание игры
  useEffect(() => {
    if (!mediator) return;
    const GAME_OVER_EVENT = CONFIG.MEDIATOR.EVENTS.GAME_OVER;
    const handler = () => setIsGameOver(true);
    mediator.subscribe(GAME_OVER_EVENT, handler);
    return () => mediator.unsubscribe(GAME_OVER_EVENT, handler);
  }, [mediator]);

  const handleExitToLobby = () => {
    setIsGameOver(false);
    setPage(PAGES.LOBBY);
  };

  return (
    <div className="game-page">
      <header className="game-header">
        <div className="game-user">
          <strong>{username}</strong>
        </div>
        <button type="button" className="game-exit" onClick={handleExitToLobby}>
          Выход в лобби
        </button>
      </header>

      <div className="game-canvas-wrapper">
        <canvas ref={canvasRef} className="game-canvas" />
      </div>

      {isGameOver && (
        <div className="game-overlay">
          <div className="game-overlay-content">
            <h2>Игра окончена</h2>
            <button onClick={handleExitToLobby}>В лобби</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;